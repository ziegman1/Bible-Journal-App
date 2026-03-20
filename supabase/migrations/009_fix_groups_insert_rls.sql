-- Fix groups INSERT RLS: use SECURITY DEFINER function so auth.uid() is available
-- when called from server actions (cookie-based session)

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

  INSERT INTO groups (name, description, admin_user_id)
  VALUES (p_name, NULLIF(trim(COALESCE(p_description, '')), ''), v_user_id)
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  RETURN v_group_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_group_public(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_public(TEXT, TEXT) TO service_role;
