-- App experience path after onboarding (Start Here): journey | custom | full
-- custom_dashboard_modules: ordered list of dashboard section ids (see lib/app-experience-mode/dashboard-modules.ts)
-- journey_progress: extensible JSON for progressive unlocks (placeholder shape)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_experience_mode text
    CHECK (app_experience_mode IS NULL OR app_experience_mode IN ('journey', 'custom', 'full'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_dashboard_modules jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS journey_progress jsonb NOT NULL DEFAULT '{"version":1,"currentStepIndex":0,"completedStepIds":[],"unlockedToolIds":[]}'::jsonb;

COMMENT ON COLUMN public.profiles.app_experience_mode IS 'First-run path: journey (guided), custom (module picker), full (BADWR dashboard). NULL = must complete Start Here.';
COMMENT ON COLUMN public.profiles.custom_dashboard_modules IS 'JSON array of dashboard module ids when app_experience_mode = custom.';
COMMENT ON COLUMN public.profiles.journey_progress IS 'Guided journey state: steps completed, tools unlocked; extend without breaking version.';

-- Existing completed onboarding users: default to full so they are not blocked at /start-here
UPDATE public.profiles
SET app_experience_mode = 'full'
WHERE onboarding_complete = true
  AND app_experience_mode IS NULL;
