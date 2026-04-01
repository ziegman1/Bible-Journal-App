-- Manual adjustments (percentage points) applied to BADWR reproduction pillar scores after computed averages.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badwr_reproduction_score_deltas jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.badwr_reproduction_score_deltas IS
  'Optional per-pillar delta in percentage points (e.g. {"pray":5}) added to computed 0–1 scores, clamped to [0,1]. Keys: word_soaps, pray, chat, thirds, share.';
