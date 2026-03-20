-- Allow unauthenticated preview of valid pending invite (group name, inviter) for sign-in prompt
CREATE OR REPLACE FUNCTION get_invite_preview_public(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT gi.group_id, g.name AS group_name, gi.invited_by_name
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
    'inviter_name', COALESCE(v_invite.invited_by_name, 'A group admin')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invite_preview_public(TEXT) TO authenticated;
