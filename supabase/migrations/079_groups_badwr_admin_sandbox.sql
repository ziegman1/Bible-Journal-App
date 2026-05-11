-- Admin-only QA: isolated 3/3rds sandbox groups (seeded rows, resettable).
-- Real groups keep badwr_admin_sandbox = false.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS badwr_admin_sandbox BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN groups.badwr_admin_sandbox IS
  'When true, this group is an admin test sandbox: invites/streak metrics are app-gated; meetings may be deleted by group admin for reseeding.';

CREATE INDEX IF NOT EXISTS idx_groups_badwr_admin_sandbox_admin
  ON groups (admin_user_id)
  WHERE badwr_admin_sandbox = true;

-- Allow group admins to delete meetings only inside sandbox groups (for scenario reseeds).
CREATE POLICY "Group admin can delete sandbox meetings" ON group_meetings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_meetings.group_id
        AND COALESCE(g.badwr_admin_sandbox, false) = true
        AND is_group_admin(g.id, auth.uid())
    )
  );
