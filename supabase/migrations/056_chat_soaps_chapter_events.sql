-- Append-only log of CHAT SOAPS chapter completions for daily "forward consecutive" validation.
-- Pair pace still uses bookmarks + pair_shared_chapters_from_plan; events add per-completion history.

CREATE TABLE IF NOT EXISTS chat_soaps_chapter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL CHECK (chapter >= 1),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_soaps_chapter_events_group_completed
  ON chat_soaps_chapter_events (group_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_soaps_chapter_events_group_user_completed
  ON chat_soaps_chapter_events (group_id, user_id, completed_at DESC);

COMMENT ON TABLE chat_soaps_chapter_events IS
  'Each time a member finishes a chapter in CHAT SOAPS reader mode; used with the group plan to verify ordered forward reading (e.g. 3 consecutive chapters from shared baseline on a practice day).';

ALTER TABLE chat_soaps_chapter_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members read chat_soaps_chapter_events"
  ON chat_soaps_chapter_events FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members insert own chat_soaps_chapter_events"
  ON chat_soaps_chapter_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id, auth.uid())
  );

-- Pair pace + daily baseline need every member’s bookmark, not only the current user.
DROP POLICY IF EXISTS "Users read own chat_soaps_reading_progress" ON chat_soaps_reading_progress;

CREATE POLICY "Group members read chat_soaps_reading_progress"
  ON chat_soaps_reading_progress FOR SELECT
  USING (is_group_member(group_id, auth.uid()));
