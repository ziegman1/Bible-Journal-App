-- Replace percentage-point score tweaks with count-based adjustments fed into cumulative BADWR math.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badwr_reproduction_count_adjustments jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.badwr_reproduction_count_adjustments IS
  'Manual activity corrections for reproduction check: soaps_qualifying, reading_sessions, prayer_minutes, share_encounters (totals split across weeks), thirds_meeting_weeks (participated or attended-week count).';

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS badwr_reproduction_score_deltas;
