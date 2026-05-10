-- Solo 3/3rds: optional Discovery Bible Study (DBS) mode with verse-anchored observations.

CREATE TABLE IF NOT EXISTS thirds_solo_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  solo_look_up_mode TEXT NOT NULL DEFAULT 'devotional'
    CHECK (solo_look_up_mode IN ('devotional', 'dbs')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE thirds_solo_user_preferences IS
  'Per-user default for Personal 3/3rds Look Up: devotional (free-form) vs DBS (verse-anchored).';

ALTER TABLE thirds_personal_weeks
  ADD COLUMN IF NOT EXISTS completed_look_up_mode TEXT NULL
    CHECK (completed_look_up_mode IS NULL OR completed_look_up_mode IN ('devotional', 'dbs'));

COMMENT ON COLUMN thirds_personal_weeks.completed_look_up_mode IS
  'Which Look Up mode was used when this week was finalized (null = legacy rows before this column).';

CREATE TABLE IF NOT EXISTS thirds_personal_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_week_id UUID NOT NULL REFERENCES thirds_personal_weeks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observation_type TEXT NOT NULL
    CHECK (observation_type IN ('like', 'difficult', 'teaches_about_people', 'teaches_about_god')),
  book TEXT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse_number SMALLINT NOT NULL,
  verse_end SMALLINT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT thirds_personal_observations_week_type_unique UNIQUE (personal_week_id, observation_type),
  CONSTRAINT thirds_personal_observations_verse_end_valid
    CHECK (verse_end IS NULL OR verse_end >= verse_number)
);

CREATE INDEX IF NOT EXISTS idx_thirds_personal_observations_week
  ON thirds_personal_observations (personal_week_id);

COMMENT ON TABLE thirds_personal_observations IS
  'Verse-anchored Look Up observations for solo DBS mode (one row per week per discovery type).';

ALTER TABLE thirds_solo_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE thirds_personal_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own solo look up preferences"
  ON thirds_solo_user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage observations for own personal weeks"
  ON thirds_personal_observations FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM thirds_personal_weeks w
      WHERE w.id = thirds_personal_observations.personal_week_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM thirds_personal_weeks w
      WHERE w.id = thirds_personal_observations.personal_week_id
        AND w.user_id = auth.uid()
    )
  );
