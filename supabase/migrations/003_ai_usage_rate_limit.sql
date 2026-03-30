-- BADWR - AI Usage Rate Limiting
-- Run after 002_study_threads_and_extensions.sql

-- ai_usage: tracks daily AI request count per user (UTC date boundaries)
CREATE TABLE ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, usage_date DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai_usage" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- Atomic increment for rate limiting (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_usage_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot increment usage for another user';
  END IF;
  INSERT INTO ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, p_usage_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    request_count = ai_usage.request_count + 1,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION increment_ai_usage(UUID, DATE) TO authenticated;
