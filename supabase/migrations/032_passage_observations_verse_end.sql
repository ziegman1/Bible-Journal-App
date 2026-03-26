-- Optional inclusive end verse for observation ranges (e.g. vv. 3–4). NULL = single verse at verse_number.
ALTER TABLE passage_observations
  ADD COLUMN IF NOT EXISTS verse_end INTEGER NULL;

COMMENT ON COLUMN passage_observations.verse_end IS
  'Inclusive end verse when the observation spans a range; NULL means a single verse at verse_number.';

ALTER TABLE passage_observations
  DROP CONSTRAINT IF EXISTS passage_observations_verse_end_valid;

ALTER TABLE passage_observations
  ADD CONSTRAINT passage_observations_verse_end_valid
  CHECK (verse_end IS NULL OR verse_end >= verse_number);
