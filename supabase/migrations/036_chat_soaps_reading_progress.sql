-- Per-user, per-CHAT-group SOAPS reading pointer for dashboard "Start today's SOAPS" resume.
-- Updated only when the user saves a SOAPS journal entry from the reader with ?chatSoapsGroup=...

CREATE TABLE IF NOT EXISTS chat_soaps_reading_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  last_completed_chapter INTEGER NOT NULL CHECK (last_completed_chapter >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_soaps_reading_progress_group_id
  ON chat_soaps_reading_progress (group_id);

COMMENT ON TABLE chat_soaps_reading_progress IS
  'Last chapter the user completed (saved SOAPS for) in the reader while in CHAT SOAPS mode for this group.';

ALTER TABLE chat_soaps_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat_soaps_reading_progress"
  ON chat_soaps_reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat_soaps_reading_progress"
  ON chat_soaps_reading_progress FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Users update own chat_soaps_reading_progress"
  ON chat_soaps_reading_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id, auth.uid())
  );
