-- One row per user per practice day when they enter "Pray for your Oikos" (counts toward prayer streak / meter).

CREATE TABLE IF NOT EXISTS oikos_prayer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, practice_date)
);

CREATE INDEX IF NOT EXISTS idx_oikos_prayer_visits_user_started
  ON oikos_prayer_visits (user_id, started_at DESC);

COMMENT ON TABLE oikos_prayer_visits IS
  'User opened the Oikos evangelistic prayer flow on this practice date; drives streak with prayer_daily_completions.';

ALTER TABLE oikos_prayer_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own oikos prayer visits"
  ON oikos_prayer_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own oikos prayer visits"
  ON oikos_prayer_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own oikos prayer visits"
  ON oikos_prayer_visits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
