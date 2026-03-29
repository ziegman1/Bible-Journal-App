-- Prayer Wheel (MetaCamp-style): log each completed segment for weekly stats and dashboard gauge.

CREATE TABLE IF NOT EXISTS prayer_wheel_segment_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_index SMALLINT NOT NULL CHECK (step_index >= 0 AND step_index <= 11),
  duration_minutes SMALLINT NOT NULL CHECK (duration_minutes >= 1 AND duration_minutes <= 15),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayer_wheel_segment_user_completed
  ON prayer_wheel_segment_completions (user_id, completed_at DESC);

COMMENT ON TABLE prayer_wheel_segment_completions IS
  'One row per finished Prayer Wheel slot; duration matches the timer increment the user chose for that session.';

ALTER TABLE prayer_wheel_segment_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prayer wheel completions"
  ON prayer_wheel_segment_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prayer wheel completions"
  ON prayer_wheel_segment_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
