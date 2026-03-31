-- Per-user weekly targets for Share and Prayer dashboard metrics (BADWR rhythm).
-- Defaults: 5 shares / week, 60 prayer minutes / week.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_share_goal_encounters integer NOT NULL DEFAULT 5
    CHECK (weekly_share_goal_encounters >= 1 AND weekly_share_goal_encounters <= 50),
  ADD COLUMN IF NOT EXISTS weekly_prayer_goal_minutes integer NOT NULL DEFAULT 60
    CHECK (weekly_prayer_goal_minutes >= 5 AND weekly_prayer_goal_minutes <= 600);

COMMENT ON COLUMN public.profiles.weekly_share_goal_encounters IS 'Weekly share encounter goal for dashboard pace and BADWR Share pillar.';
COMMENT ON COLUMN public.profiles.weekly_prayer_goal_minutes IS 'Weekly prayer minutes goal (wheel + extra) for dashboard and BADWR Pray pillar.';
