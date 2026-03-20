-- Bible Journal - Insight Summaries (AI cache)
-- Run after 005_fix_signup_trigger.sql

CREATE TABLE insight_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  range_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, range_type, start_date, end_date)
);

CREATE INDEX idx_insight_summaries_user_id ON insight_summaries(user_id);
CREATE INDEX idx_insight_summaries_user_range ON insight_summaries(user_id, range_type, start_date, end_date);

CREATE TRIGGER update_insight_summaries_updated_at
  BEFORE UPDATE ON insight_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE insight_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own insight_summaries" ON insight_summaries
  FOR ALL USING (auth.uid() = user_id);
