-- Allow observations without a verse anchor (non–Starter Track). verse_end only when verse_number is set.
ALTER TABLE passage_observations
  ALTER COLUMN verse_number DROP NOT NULL;

ALTER TABLE passage_observations
  DROP CONSTRAINT IF EXISTS passage_observations_verse_end_valid;

ALTER TABLE passage_observations
  ADD CONSTRAINT passage_observations_verse_anchor_pair
  CHECK (
    (verse_number IS NULL AND verse_end IS NULL)
    OR (
      verse_number IS NOT NULL
      AND (verse_end IS NULL OR verse_end >= verse_number)
    )
  );

COMMENT ON COLUMN passage_observations.verse_number IS
  'Start verse for anchored notes; NULL when the participant did not anchor to a verse (non–Starter Track).';
