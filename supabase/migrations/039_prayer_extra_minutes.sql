-- À la carte prayer time: user-reported minutes in 5-minute blocks, rolled into weekly prayer stats.

CREATE TABLE IF NOT EXISTS prayer_extra_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes SMALLINT NOT NULL CHECK (minutes >= 5 AND minutes <= 180 AND minutes % 5 = 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayer_extra_minutes_user_logged
  ON prayer_extra_minutes (user_id, logged_at DESC);

COMMENT ON TABLE prayer_extra_minutes IS
  'Additional prayer time the user logs in 5-minute increments; summed with Prayer Wheel segments for weekly totals.';

ALTER TABLE prayer_extra_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prayer extra minutes"
  ON prayer_extra_minutes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prayer extra minutes"
  ON prayer_extra_minutes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
