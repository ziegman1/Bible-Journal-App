-- Archived groups (soft-hide from main list) + admin may delete groups

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN groups.archived_at IS 'When set, group is archived — listed on /app/groups/archived only.';

CREATE INDEX IF NOT EXISTS idx_groups_archived_at
  ON groups (archived_at)
  WHERE archived_at IS NOT NULL;

-- UPDATE: admins or original creator (e.g. archive / unarchive)
DROP POLICY IF EXISTS "Group admin can update group" ON groups;

CREATE POLICY "Group admin or creator can update group" ON groups
  FOR UPDATE USING (
    is_group_admin(id, auth.uid()) OR admin_user_id = auth.uid()
  );

-- DELETE: admins or original creator
DROP POLICY IF EXISTS "Group creator can delete group" ON groups;
DROP POLICY IF EXISTS "Group admin can delete group" ON groups;

CREATE POLICY "Group admin or creator can delete group" ON groups
  FOR DELETE USING (
    is_group_admin(id, auth.uid()) OR admin_user_id = auth.uid()
  );
