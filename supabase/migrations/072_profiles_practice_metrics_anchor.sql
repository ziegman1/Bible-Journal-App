-- Optional "day 1" for practice metrics: dashboard gauges, streaks, formation momentum ingestion, etc.
-- When set, metrics treat this calendar date (user’s practice timezone at reset time) as the start
-- instead of auth.users.created_at. Does not delete historical activity data.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS practice_metrics_anchor_ymd date NULL;

COMMENT ON COLUMN public.profiles.practice_metrics_anchor_ymd IS
  'First day included in practice metrics after a user reset; null means use account signup date.';
