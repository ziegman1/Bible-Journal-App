-- Solo / à la carte 3/3rds: Look Back · Look Up · Look Forward without a formal group.
-- Weekly finalized rows count toward participation stats; optional "group completed" milestones.

CREATE TABLE IF NOT EXISTS thirds_participation_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  participation_started_on DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS thirds_personal_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_monday DATE NOT NULL,
  prior_obedience_done BOOLEAN NOT NULL DEFAULT false,
  prior_sharing_done BOOLEAN NOT NULL DEFAULT false,
  prior_train_done BOOLEAN NOT NULL DEFAULT false,
  passage_ref TEXT NOT NULL DEFAULT '',
  observation_like TEXT NOT NULL DEFAULT '',
  observation_difficult TEXT NOT NULL DEFAULT '',
  observation_teaches_people TEXT NOT NULL DEFAULT '',
  observation_teaches_god TEXT NOT NULL DEFAULT '',
  obedience_statement TEXT NOT NULL DEFAULT '',
  sharing_commitment TEXT NOT NULL DEFAULT '',
  train_commitment TEXT NOT NULL DEFAULT '',
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT thirds_personal_weeks_user_week UNIQUE (user_id, week_start_monday)
);

CREATE INDEX IF NOT EXISTS idx_thirds_personal_weeks_user_finalized
  ON thirds_personal_weeks (user_id, week_start_monday DESC)
  WHERE finalized_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS thirds_personal_group_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thirds_personal_group_completions_user
  ON thirds_personal_group_completions (user_id, completed_at DESC);

COMMENT ON TABLE thirds_participation_settings IS
  'Start date for week-over-week 3/3rds participation ratio (solo or alongside formal groups).';

COMMENT ON TABLE thirds_personal_weeks IS
  'One row per user per UTC Monday week: solo Look Back / Up / Forward; finalized_at counts as participation.';

ALTER TABLE thirds_participation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE thirds_personal_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE thirds_personal_group_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own thirds participation settings"
  ON thirds_participation_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own thirds personal weeks"
  ON thirds_personal_weeks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own thirds group completions"
  ON thirds_personal_group_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
