-- Group-level gate: show "new to 3/3rds?" once per group before the first meeting.
-- Default true so legacy / in-progress groups are unchanged.
-- Meeting INSERT enforcement (RLS bypass): see migration 051_group_meetings_starter_track_prompt_trigger.sql.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS starter_track_prompt_answered BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN groups.starter_track_prompt_answered IS
  'False until the group answers the first-meeting Starter Track vs experienced prompt; true for legacy groups.';

-- Rows already waiting on onboarding must see the prompt
UPDATE groups
SET starter_track_prompt_answered = false
WHERE onboarding_pending = true;

-- 3/3rds groups: new rows need the prompt until answered
CREATE OR REPLACE FUNCTION create_group_public(p_name TEXT, p_description TEXT DEFAULT NULL)
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
    starter_track_prompt_answered
  )
  VALUES (
    p_name,
    NULLIF(trim(COALESCE(p_description, '')), ''),
    v_user_id,
    true,
    false
  )
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_group_public(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_public(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION complete_group_onboarding_public(
  p_group_id UUID,
  p_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  IF p_path IS NULL OR p_path NOT IN ('starter_track', 'experienced') THEN
    RAISE EXCEPTION 'Invalid onboarding path';
  END IF;

  IF NOT is_group_member(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  UPDATE groups SET
    onboarding_pending = false,
    onboarding_path = p_path,
    onboarding_completed_at = NOW(),
    starter_track_prompt_answered = true,
    updated_at = NOW()
  WHERE id = p_group_id
    AND onboarding_pending = true;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_group_onboarding_public(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_group_onboarding_public(UUID, TEXT) TO service_role;

-- CHAT groups: explicitly answered (no 3/3rds prompt)
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
    group_kind,
    starter_track_prompt_answered
  )
  VALUES (
    trim(p_name),
    NULLIF(trim(COALESCE(p_description, '')), ''),
    v_user_id,
    false,
    NULL,
    'chat',
    true
  )
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_chat_group_public(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_group_public(TEXT, TEXT) TO service_role;
