/**
 * Minimum time after completing a Guided Journey SOAPS step before the following lesson unlocks.
 * Tune here (or later via env / admin) without changing call sites.
 */
export const SOAPS_TO_LESSON_DELAY_HOURS = 12;

export const SOAPS_TO_LESSON_MIN_DELAY_MS = SOAPS_TO_LESSON_DELAY_HOURS * 60 * 60 * 1000;
