-- One observation note per user per meeting per prompt type (enables upsert + clean realtime).
-- Dedupe legacy duplicates (keep newest by created_at).

DELETE FROM passage_observations
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY meeting_id, user_id, observation_type
        ORDER BY created_at DESC NULLS LAST, id DESC
      ) AS rn
    FROM passage_observations
  ) t
  WHERE rn > 1
);

ALTER TABLE passage_observations
  ADD CONSTRAINT passage_observations_meeting_user_type_key
  UNIQUE (meeting_id, user_id, observation_type);

ALTER PUBLICATION supabase_realtime ADD TABLE passage_observations;
