-- CHAT accountability groups: max 3 members, shared schedule/reading plan with unanimous agreement

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS group_kind TEXT NOT NULL DEFAULT 'thirds'
  CHECK (group_kind IN ('thirds', 'chat'));

COMMENT ON COLUMN groups.group_kind IS 'thirds = 3/3rds; chat = CHAT accountability (max 3 members).';

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS chat_weekday SMALLINT NULL
  CHECK (chat_weekday IS NULL OR (chat_weekday >= 0 AND chat_weekday <= 6));

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS chat_meeting_time_text TEXT NULL;

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS chat_reading_plan TEXT NULL;

-- Agreed schedule (updated when a proposal is unanimously accepted)
COMMENT ON COLUMN groups.chat_weekday IS '0=Sunday … 6=Saturday; set when CHAT plan is agreed.';

CREATE TABLE chat_group_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  proposed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  meeting_time_text TEXT NOT NULL,
  reading_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_agreement'
    CHECK (status IN ('pending_agreement', 'active', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_group_proposals_group_status
  ON chat_group_proposals (group_id, status);

CREATE TABLE chat_group_proposal_agreements (
  proposal_id UUID NOT NULL REFERENCES chat_group_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (proposal_id, user_id)
);

CREATE INDEX idx_chat_proposal_agreements_proposal
  ON chat_group_proposal_agreements (proposal_id);

ALTER TABLE chat_group_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_proposal_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_proposals_select" ON chat_group_proposals FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "chat_proposals_insert" ON chat_group_proposals FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND proposed_by_user_id = auth.uid()
  );

CREATE POLICY "chat_proposals_update" ON chat_group_proposals FOR UPDATE
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "chat_agreements_select" ON chat_group_proposal_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_proposals p
      WHERE p.id = proposal_id AND is_group_member(p.group_id, auth.uid())
    )
  );

CREATE POLICY "chat_agreements_insert" ON chat_group_proposal_agreements FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_group_proposals p
      WHERE p.id = proposal_id AND is_group_member(p.group_id, auth.uid())
    )
  );

CREATE POLICY "chat_agreements_update" ON chat_group_proposal_agreements FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_group_proposals p
      WHERE p.id = proposal_id AND is_group_member(p.group_id, auth.uid())
    )
  );

-- Create CHAT group: no 3/3rds onboarding gate
CREATE OR REPLACE FUNCTION create_chat_group_public(p_name TEXT, p_description TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO groups (
    name,
    description,
    admin_user_id,
    onboarding_pending,
    onboarding_path,
    group_kind
  )
  VALUES (
    trim(p_name),
    NULLIF(trim(COALESCE(p_description, '')), ''),
    v_user_id,
    false,
    NULL,
    'chat'
  )
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_chat_group_public(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_group_public(TEXT, TEXT) TO service_role;

-- Invite preview: expose group_kind for CHAT vs 3/3rds copy
CREATE OR REPLACE FUNCTION get_invite_preview_public(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT g.name AS group_name, gi.invited_by_name, gi.expires_at,
         COALESCE(g.group_kind, 'thirds') AS group_kind
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
    'expires_at', v_invite.expires_at,
    'group_kind', v_invite.group_kind
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO authenticated;

-- Block joining CHAT group when already at 3 members
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
  v_member_count INT;
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

  IF EXISTS (
    SELECT 1 FROM groups
    WHERE id = v_invite.group_id AND COALESCE(group_kind, 'thirds') = 'chat'
  ) THEN
    SELECT COUNT(*)::int INTO v_member_count FROM group_members WHERE group_id = v_invite.group_id;
    IF v_member_count >= 3 THEN
      RETURN jsonb_build_object('error', 'CHAT_GROUP_FULL');
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
