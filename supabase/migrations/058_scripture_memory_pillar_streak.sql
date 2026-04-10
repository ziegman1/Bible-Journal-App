-- Scripture Memory daily logs (practice calendar date) + explicit 3/3 pillar-week streak credits.

CREATE TABLE IF NOT EXISTS scripture_memory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  memorized_new_count INTEGER NOT NULL DEFAULT 0 CHECK (memorized_new_count >= 0),
  reviewed_count INTEGER NOT NULL DEFAULT 0 CHECK (reviewed_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scripture_memory_logs_user_day UNIQUE (user_id, practice_date)
);

CREATE INDEX IF NOT EXISTS idx_scripture_memory_logs_user_practice_date
  ON scripture_memory_logs (user_id, practice_date DESC);

COMMENT ON TABLE scripture_memory_logs IS
  'One row per user per practice calendar day: memorization/review counts for streaks and stats.';

ALTER TABLE scripture_memory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scripture_memory_logs"
  ON scripture_memory_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER update_scripture_memory_logs_updated_at
  BEFORE UPDATE ON scripture_memory_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Explicit 3/3 weekly streak: one credit per user per pillar week (Sun start, practice TZ) when user completes 3/3.
CREATE TABLE IF NOT EXISTS pillar_week_streak_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar_week_start_ymd DATE NOT NULL,
  source TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  meeting_id UUID REFERENCES group_meetings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pillar_week_streak_completions_user_week UNIQUE (user_id, pillar_week_start_ymd)
);

CREATE INDEX IF NOT EXISTS idx_pillar_week_streak_completions_user_week
  ON pillar_week_streak_completions (user_id, pillar_week_start_ymd DESC);

COMMENT ON TABLE pillar_week_streak_completions IS
  'User tapped Complete 3/3 (solo finalize, informal group, or group meeting) — counts once per pillar week.';

ALTER TABLE pillar_week_streak_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pillar_week_streak_completions"
  ON pillar_week_streak_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
