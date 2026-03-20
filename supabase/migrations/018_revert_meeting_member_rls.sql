-- Restore member-wide meeting lifecycle RLS (facilitator-led: any group member).
-- Reverts 017_group_meeting_admin_rls.sql policies.

DROP POLICY IF EXISTS "Group admin can update meetings" ON group_meetings;
DROP POLICY IF EXISTS "Group members can update meetings" ON group_meetings;
CREATE POLICY "Group members can update meetings" ON group_meetings
  FOR UPDATE USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group admin can insert retell assignments" ON story_retell_assignments;
DROP POLICY IF EXISTS "Group admin can update retell assignments" ON story_retell_assignments;
DROP POLICY IF EXISTS "Group admin can delete retell assignments" ON story_retell_assignments;
DROP POLICY IF EXISTS "Group members can manage retell assignments" ON story_retell_assignments;
CREATE POLICY "Group members can manage retell assignments" ON story_retell_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Group admin can insert practice assignments" ON group_practice_assignments;
DROP POLICY IF EXISTS "Group admin can update practice assignments" ON group_practice_assignments;
DROP POLICY IF EXISTS "Group admin can delete practice assignments" ON group_practice_assignments;
DROP POLICY IF EXISTS "Group members can manage practice assignments" ON group_practice_assignments;
CREATE POLICY "Group members can manage practice assignments" ON group_practice_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Group admin can insert meeting summaries" ON meeting_summaries;
DROP POLICY IF EXISTS "Group admin can update meeting summaries" ON meeting_summaries;
DROP POLICY IF EXISTS "Group admin can delete meeting summaries" ON meeting_summaries;
DROP POLICY IF EXISTS "Group members can manage summaries" ON meeting_summaries;
CREATE POLICY "Group members can manage summaries" ON meeting_summaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );
