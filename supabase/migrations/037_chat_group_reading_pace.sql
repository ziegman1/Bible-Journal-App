-- CHAT group reading pace: shared schedule (start date, chapters/day, plan start) vs per-user SOAPS bookmark.

CREATE TABLE IF NOT EXISTS chat_group_reading_pace (
  group_id UUID PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
  reading_start_date DATE NOT NULL,
  chapters_per_day SMALLINT NOT NULL CHECK (chapters_per_day >= 1 AND chapters_per_day <= 15),
  plan_start_book_id TEXT NOT NULL DEFAULT 'matthew',
  plan_start_chapter SMALLINT NOT NULL DEFAULT 1 CHECK (plan_start_chapter >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_group_reading_pace_updated_at
  ON chat_group_reading_pace (updated_at DESC);

COMMENT ON TABLE chat_group_reading_pace IS
  'Shared CHAT reading pace settings: calendar start, daily chapter goal, and canonical plan start (vs chat_soaps_reading_progress per user).';

ALTER TABLE chat_group_reading_pace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view chat_group_reading_pace"
  ON chat_group_reading_pace FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can insert chat_group_reading_pace"
  ON chat_group_reading_pace FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can update chat_group_reading_pace"
  ON chat_group_reading_pace FOR UPDATE
  USING (is_group_member(group_id, auth.uid()))
  WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE OR REPLACE TRIGGER update_chat_group_reading_pace_updated_at
  BEFORE UPDATE ON chat_group_reading_pace
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
