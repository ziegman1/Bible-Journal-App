-- Harden invites: cancelled status, one pending invite per group+email, idempotent accept, row lock

-- Allow cancelled status on invites
ALTER TABLE group_invites DROP CONSTRAINT IF EXISTS group_invites_status_check;
ALTER TABLE group_invites ADD CONSTRAINT group_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));

-- Dedupe legacy duplicate pending rows (keep newest by created_at) before unique index
DELETE FROM group_invites gi
WHERE gi.id IN (
  SELECT id FROM (
    SELECT id,
      row_number() OVER (
        PARTITION BY group_id, lower(trim(email))
        ORDER BY created_at DESC
      ) AS rn
    FROM group_invites
    WHERE status = 'pending'
  ) d
  WHERE d.rn > 1
);

-- At most one pending invite per group + normalized email (race-safe with app insert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invites_one_pending_per_group_email
  ON group_invites (group_id, lower(trim(email)))
  WHERE status = 'pending';

-- Preview: only safe fields (no group_id in JSON); add expiration for UI
CREATE OR REPLACE FUNCTION get_invite_preview_public(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT g.name AS group_name, gi.invited_by_name, gi.expires_at
  INTO v_invite
  FROM group_invites gi
  JOIN groups g ON g.id = gi.group_id
  WHERE gi.token = p_token
    AND gi.status = 'pending'
    AND gi.expires_at > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'group_name', v_invite.group_name,
    'inviter_name', COALESCE(v_invite.invited_by_name, 'A group admin'),
    'expires_at', v_invite.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO authenticated;

-- Idempotent accept; FOR UPDATE re-validates at accept time; handles cancelled/expired/accepted
CREATE OR REPLACE FUNCTION accept_group_invite_public(
  p_token TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite RECORD;
  v_first_name TEXT;
  v_last_name TEXT;
  v_display_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('error', 'INVALID_TOKEN');
  END IF;
  v_user_email := lower(trim(v_user_email));

  SELECT id, group_id, email, status, expires_at, invitee_name
  INTO v_invite
  FROM group_invites
  WHERE token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'INVALID_TOKEN');
  END IF;

  IF v_invite.status = 'cancelled' THEN
    RETURN jsonb_build_object('error', 'CANCELLED');
  END IF;

  IF v_invite.status = 'expired'
     OR (v_invite.status = 'pending' AND v_invite.expires_at < now()) THEN
    IF v_invite.status = 'pending' AND v_invite.expires_at < now() THEN
      UPDATE group_invites SET status = 'expired' WHERE id = v_invite.id AND status = 'pending';
    END IF;
    RETURN jsonb_build_object('error', 'EXPIRED');
  END IF;

  IF v_invite.status = 'accepted' THEN
    IF v_user_email = lower(trim(v_invite.email)) THEN
      IF EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = v_invite.group_id AND user_id = v_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', true,
          'group_id', v_invite.group_id,
          'already_accepted', true
        );
      END IF;
      RETURN jsonb_build_object('error', 'ALREADY_ACCEPTED');
    END IF;
    RETURN jsonb_build_object(
      'error', 'EMAIL_MISMATCH',
      'invited_email', lower(trim(v_invite.email))
    );
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'INVALID_TOKEN');
  END IF;

  IF v_user_email <> lower(trim(v_invite.email)) THEN
    RETURN jsonb_build_object(
      'error', 'EMAIL_MISMATCH',
      'invited_email', lower(trim(v_invite.email))
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_invite.group_id AND user_id = v_user_id
  ) THEN
    UPDATE group_invites
    SET status = 'accepted', accepted_at = coalesce(accepted_at, now())
    WHERE id = v_invite.id AND status = 'pending';
    RETURN jsonb_build_object(
      'success', true,
      'group_id', v_invite.group_id,
      'already_member', true
    );
  END IF;

  IF p_first_name IS NOT NULL AND trim(p_first_name) <> '' THEN
    v_first_name := trim(p_first_name);
    v_last_name := nullif(trim(coalesce(p_last_name, '')), '');
  ELSIF v_invite.invitee_name IS NOT NULL AND trim(v_invite.invitee_name) <> '' THEN
    v_first_name := split_part(trim(v_invite.invitee_name), ' ', 1);
    v_last_name := nullif(
      trim(substring(trim(v_invite.invitee_name) from length(v_first_name) + 2)),
      ''
    );
  ELSE
    SELECT display_name INTO v_display_name FROM profiles WHERE id = v_user_id;
    IF v_display_name IS NOT NULL
       AND trim(v_display_name) <> ''
       AND trim(v_display_name) <> 'Reader' THEN
      v_first_name := split_part(trim(v_display_name), ' ', 1);
      v_last_name := nullif(
        trim(substring(trim(v_display_name) from length(v_first_name) + 2)),
        ''
      );
    ELSE
      RETURN jsonb_build_object('error', 'NEED_NAME');
    END IF;
  END IF;

  BEGIN
    INSERT INTO group_members (group_id, user_id, role, first_name, last_name, email)
    VALUES (
      v_invite.group_id,
      v_user_id,
      'member',
      v_first_name,
      v_last_name,
      v_user_email
    );

    UPDATE group_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_invite.id AND status = 'pending';

    RETURN jsonb_build_object('success', true, 'group_id', v_invite.group_id);
  EXCEPTION
    WHEN unique_violation THEN
      IF EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = v_invite.group_id AND user_id = v_user_id
      ) THEN
        UPDATE group_invites
        SET status = 'accepted', accepted_at = coalesce(accepted_at, now())
        WHERE id = v_invite.id AND status = 'pending';
        RETURN jsonb_build_object(
          'success', true,
          'group_id', v_invite.group_id,
          'already_accepted', true
        );
      END IF;
      RETURN jsonb_build_object('error', 'ALREADY_MEMBER');
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_group_invite_public(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_group_invite_public(TEXT, TEXT, TEXT) TO service_role;
