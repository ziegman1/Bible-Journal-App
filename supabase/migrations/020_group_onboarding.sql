-- Group-level 3/3rds onboarding: first workspace visit chooses Starter Track vs experienced path

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS onboarding_pending BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS onboarding_path TEXT NULL
  CHECK (onboarding_path IS NULL OR onboarding_path IN ('starter_track', 'experienced'));

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN groups.onboarding_pending IS 'True for new groups until they pick Starter Track vs experienced path';
COMMENT ON COLUMN groups.onboarding_path IS 'starter_track | experienced; null for legacy groups';

-- New groups need the onboarding gate; existing rows keep onboarding_pending = false
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

  INSERT INTO groups (name, description, admin_user_id, onboarding_pending)
  VALUES (p_name, NULLIF(trim(COALESCE(p_description, '')), ''), v_user_id, true)
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

-- Any group member can record the one-time onboarding choice (not only admin)
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
    updated_at = NOW()
  WHERE id = p_group_id
    AND onboarding_pending = true;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_group_onboarding_public(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_group_onboarding_public(UUID, TEXT) TO service_role;
