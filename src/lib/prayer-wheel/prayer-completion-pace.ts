import {
  computeWeeklyRhythmPace,
  expectedUnitsForPaceDay,
} from "@/lib/dashboard/weekly-rhythm-pace";

const WEEKLY_PRAYER_DAY_GOAL = 7;

/**
 * Weekly **days-with-prayer** meter (7-day goal). The home dashboard prayer card uses cumulative
 * minutes pace instead (home dashboard uses `practice-completion-gauge.ts`); this helper remains
 * for any weekly-only callers.
 */
export function buildPrayerWeeklyCompletionPace(
  daysWithPrayerThisWeek: number,
  asOf: Date = new Date(),
  practiceTimeZone?: string,
  opts?: {
    anchorDayIndex?: number;
    onboardingFirstWeek?: boolean;
  }
) {
  const goal = WEEKLY_PRAYER_DAY_GOAL;
  const ob = opts?.onboardingFirstWeek ?? false;
  const d = opts?.anchorDayIndex;
  const expectedSoFar =
    d != null
      ? expectedUnitsForPaceDay(d, goal, { onboardingFirstDayZero: ob })
      : undefined;

  return computeWeeklyRhythmPace({
    actual: daysWithPrayerThisWeek,
    weeklyGoal: goal,
    needleSensitivity: 9,
    unitSingular: "day",
    unitPlural: "days",
    goalLabel: "7 days with prayer",
    asOf,
    practiceTimeZone,
    daysElapsed: d,
    expectedSoFarOverride: expectedSoFar,
    paceContext: ob ? "onboarding_first_week" : "default",
  });
}
