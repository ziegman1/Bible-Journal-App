-- Optional solo Look Back journaling: Share & Care + Vision reflection (Checking In stays on prior_* flags).

ALTER TABLE thirds_personal_weeks
  ADD COLUMN IF NOT EXISTS look_back_share_care TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS look_back_vision_reflection TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN thirds_personal_weeks.look_back_share_care IS
  'Solo Share & Care: where God is at work, struggles, victories, prayer needs (optional).';

COMMENT ON COLUMN thirds_personal_weeks.look_back_vision_reflection IS
  'Solo Vision step: brief personal recommissioning / multiplication reflection (optional).';
