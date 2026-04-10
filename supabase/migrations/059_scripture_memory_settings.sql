-- Goals + running total for Scripture Memory (practice TZ for metrics; totals updated via app deltas).

CREATE TABLE IF NOT EXISTS scripture_memory_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_new_passages_goal INTEGER NOT NULL DEFAULT 5
    CHECK (monthly_new_passages_goal >= 1 AND monthly_new_passages_goal <= 30),
  daily_review_goal INTEGER NOT NULL DEFAULT 5
    CHECK (daily_review_goal >= 1 AND daily_review_goal <= 30),
  current_total_memorized INTEGER NOT NULL DEFAULT 0
    CHECK (current_total_memorized >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE scripture_memory_settings IS
  'Per-user Scripture Memory goals (1–30) and running total of passages memorized (adjusted on log edits via deltas).';

ALTER TABLE scripture_memory_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scripture_memory_settings"
  ON scripture_memory_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER update_scripture_memory_settings_updated_at
  BEFORE UPDATE ON scripture_memory_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
