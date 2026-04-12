-- Unified daily prayer completion (idempotent per user per practice date) and freestyle prayer sessions.

CREATE TABLE IF NOT EXISTS prayer_daily_completions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, practice_date)
);

CREATE INDEX IF NOT EXISTS idx_prayer_daily_completions_user_date
  ON prayer_daily_completions (user_id, practice_date DESC);

COMMENT ON TABLE prayer_daily_completions IS
  'One row per calendar day (practice timezone) the user qualified for daily prayer via wheel, extra time, or freestyle.';

ALTER TABLE prayer_daily_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prayer daily completions"
  ON prayer_daily_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own prayer daily completions"
  ON prayer_daily_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own prayer daily completions"
  ON prayer_daily_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own prayer daily completions"
  ON prayer_daily_completions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS freestyle_prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 1 AND duration_seconds <= 86400),
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_freestyle_prayer_user_ended
  ON freestyle_prayer_sessions (user_id, ended_at DESC);

CREATE INDEX IF NOT EXISTS idx_freestyle_prayer_user_practice_date
  ON freestyle_prayer_sessions (user_id, practice_date DESC);

COMMENT ON TABLE freestyle_prayer_sessions IS
  'Completed freestyle prayer timer sessions; practice_date is the calendar day in the user''s practice timezone when the session ended.';

ALTER TABLE freestyle_prayer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own freestyle prayer sessions"
  ON freestyle_prayer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own freestyle prayer sessions"
  ON freestyle_prayer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own freestyle prayer sessions"
  ON freestyle_prayer_sessions FOR DELETE
  USING (auth.uid() = user_id);
