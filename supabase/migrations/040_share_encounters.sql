-- Gospel / testimony share logs for dashboard pace and response breakdown.

CREATE TABLE IF NOT EXISTS share_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encounter_date DATE NOT NULL,
  location TEXT NOT NULL,
  shared_type TEXT NOT NULL CHECK (shared_type IN ('gospel', 'testimony', 'both')),
  received TEXT NOT NULL CHECK (
    received IN ('red_light', 'yellow_light', 'green_light', 'already_christian')
  ),
  follow_up TEXT NOT NULL CHECK (follow_up IN ('discovery_group', 'thirds_group')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT share_encounters_location_nonempty CHECK (length(trim(location)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_share_encounters_user_date
  ON share_encounters (user_id, encounter_date DESC);

COMMENT ON TABLE share_encounters IS
  'User-logged gospel/testimony shares; weekly counts feed the Share dashboard card and BADWR Share pillar.';

ALTER TABLE share_encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own share encounters"
  ON share_encounters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own share encounters"
  ON share_encounters FOR INSERT
  WITH CHECK (auth.uid() = user_id);
