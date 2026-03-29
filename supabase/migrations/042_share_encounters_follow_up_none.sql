-- Allow "none" for share encounter follow-up path.

ALTER TABLE share_encounters DROP CONSTRAINT IF EXISTS share_encounters_follow_up_check;

ALTER TABLE share_encounters ADD CONSTRAINT share_encounters_follow_up_check
  CHECK (follow_up IN ('discovery_group', 'thirds_group', 'none'));
