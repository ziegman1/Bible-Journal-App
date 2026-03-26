-- Align INSERT policies with lookback_responses: require group membership for the meeting's group.
-- Prevents inserting own rows into another group's meeting when meeting_id is known.

DROP POLICY IF EXISTS "Users can insert own prior followup" ON prior_obedience_followups;
CREATE POLICY "Users can insert own prior followup" ON prior_obedience_followups
  FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
    WHERE gm.id = meeting_id AND gmem.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own observation" ON passage_observations;
CREATE POLICY "Users can insert own observation" ON passage_observations
  FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
    WHERE gm.id = meeting_id AND gmem.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own lookforward response" ON lookforward_responses;
CREATE POLICY "Users can insert own lookforward response" ON lookforward_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
    WHERE gm.id = meeting_id AND gmem.user_id = auth.uid()
  ));
