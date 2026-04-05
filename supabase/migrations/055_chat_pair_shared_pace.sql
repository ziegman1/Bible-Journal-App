-- Pair-aligned CHAT pace: chapters completed through the slowest active reader (from plan start).
-- When this value decreases (grace / realign), the app resets reading_start_date so the pair is not penalized vs calendar.

ALTER TABLE chat_group_reading_pace
  ADD COLUMN IF NOT EXISTS pair_shared_chapters_from_plan INTEGER NOT NULL DEFAULT 0
  CHECK (pair_shared_chapters_from_plan >= 0);

COMMENT ON COLUMN chat_group_reading_pace.pair_shared_chapters_from_plan IS
  'Chapters from plan_start through the inclusive minimum of members who have chat_soaps_reading_progress; pace compares this to calendar expectation.';
