-- Guided Journey uses profiles.journey_progress (jsonb) with shape:
--   version: 1
--   currentPhase: 1..5 (cumulative unlock bands)
--   currentStepIndex: legacy / optional UI step
--   completedStepIds: string[]
--   unlockedToolIds: string[] — slugs: soaps, prayer, scripture_memory, thirds, share, chat, list_of_100
-- Application code is the source of truth (see lib/app-experience-mode/journey-progress.ts).

COMMENT ON COLUMN public.profiles.journey_progress IS
'Guided Journey: { version, currentPhase, currentStepIndex, completedStepIds, unlockedToolIds[] }. '
'Phases unlock tools cumulatively; unlockedToolIds can extend beyond phase for manual/mentor grants.';
