-- SECURITY DEFINER function for invite acceptance (invitee is not yet a member/admin)
-- so RLS does not block the insert into group_members or update to group_invites

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

  SELECT id, group_id, email, status, expires_at, invitee_name
  INTO v_invite
  FROM group_invites
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'INVALID_TOKEN');
  END IF;

  IF v_invite.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'ALREADY_ACCEPTED');
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'EXPIRED');
  END IF;

  IF LOWER(TRIM(v_user_email)) != LOWER(TRIM(v_invite.email)) THEN
    RETURN jsonb_build_object('error', 'EMAIL_MISMATCH');
  END IF;

  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = v_invite.group_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('error', 'ALREADY_MEMBER');
  END IF;

  -- Derive first_name, last_name: params > invitee_name > profile display_name
  IF p_first_name IS NOT NULL AND TRIM(p_first_name) != '' THEN
    v_first_name := TRIM(p_first_name);
    v_last_name := NULLIF(TRIM(COALESCE(p_last_name, '')), '');
  ELSIF v_invite.invitee_name IS NOT NULL AND TRIM(v_invite.invitee_name) != '' THEN
    v_first_name := SPLIT_PART(TRIM(v_invite.invitee_name), ' ', 1);
    v_last_name := NULLIF(TRIM(SUBSTRING(TRIM(v_invite.invitee_name) FROM LENGTH(v_first_name) + 2)), '');
  ELSE
    SELECT display_name INTO v_display_name FROM profiles WHERE id = v_user_id;
    IF v_display_name IS NOT NULL AND TRIM(v_display_name) != '' AND TRIM(v_display_name) != 'Reader' THEN
      v_first_name := SPLIT_PART(TRIM(v_display_name), ' ', 1);
      v_last_name := NULLIF(TRIM(SUBSTRING(TRIM(v_display_name) FROM LENGTH(v_first_name) + 2)), '');
    ELSE
      RETURN jsonb_build_object('error', 'NEED_NAME');
    END IF;
  END IF;

  INSERT INTO group_members (group_id, user_id, role, first_name, last_name, email)
  VALUES (
    v_invite.group_id,
    v_user_id,
    'member',
    v_first_name,
    v_last_name,
    LOWER(TRIM(v_user_email))
  );

  UPDATE group_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'group_id', v_invite.group_id);
END;
$$;

GRANT EXECUTE ON FUNCTION accept_group_invite_public(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_group_invite_public(TEXT, TEXT, TEXT) TO service_role;
