-- NOTE: Superseded for product by 018_revert_meeting_member_rls.sql (any member may run meetings).
-- Align meeting lifecycle & facilitator-style writes with group-scoped admin (not platform-wide).
-- SELECT / member participation policies unchanged.

-- group_meetings: only group admins update rows (status, facilitator, etc.); members still insert new meetings
DROP POLICY IF EXISTS "Group members can update meetings" ON group_meetings;
CREATE POLICY "Group admin can update meetings" ON group_meetings
  FOR UPDATE USING (is_group_admin(group_id, auth.uid()));

-- story_retell_assignments: members keep SELECT; admin-only writes
DROP POLICY IF EXISTS "Group members can manage retell assignments" ON story_retell_assignments;
CREATE POLICY "Group admin can insert retell assignments" ON story_retell_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can update retell assignments" ON story_retell_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can delete retell assignments" ON story_retell_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );

-- group_practice_assignments: members keep SELECT; admin-only writes
DROP POLICY IF EXISTS "Group members can manage practice assignments" ON group_practice_assignments;
CREATE POLICY "Group admin can insert practice assignments" ON group_practice_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can update practice assignments" ON group_practice_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can delete practice assignments" ON group_practice_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );

-- meeting_summaries: members keep SELECT; admin-only writes (generate/regenerate summary)
DROP POLICY IF EXISTS "Group members can manage summaries" ON meeting_summaries;
CREATE POLICY "Group admin can insert meeting summaries" ON meeting_summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can update meeting summaries" ON meeting_summaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
CREATE POLICY "Group admin can delete meeting summaries" ON meeting_summaries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem
        ON gm.group_id = gmem.group_id
        AND gmem.user_id = auth.uid()
        AND gmem.role = 'admin'
      WHERE gm.id = meeting_id
    )
  );
