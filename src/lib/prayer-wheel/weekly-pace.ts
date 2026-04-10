import {
  computeWeeklyRhythmPace,
  expectedUnitsForPaceDay,
} from "@/lib/dashboard/weekly-rhythm-pace";
import { DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";

/** Weekly needle pace vs weekly prayer goal (pillar week or onboarding window). */
export function buildPrayerWheelWeeklyPace(
  weeklyMinutes: number,
  asOf: Date = new Date(),
  practiceTimeZone?: string,
  weeklyGoalMinutes: number = DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES,
  opts?: {
    anchorDayIndex?: number;
    onboardingFirstWeek?: boolean;
  }
) {
  const goal = Math.max(1, Math.floor(weeklyGoalMinutes));
  const ob = opts?.onboardingFirstWeek ?? false;
  const d = opts?.anchorDayIndex;
  const expectedSoFar =
    d != null
      ? expectedUnitsForPaceDay(d, goal, { onboardingFirstDayZero: ob })
      : undefined;

  return computeWeeklyRhythmPace({
    actual: weeklyMinutes,
    weeklyGoal: goal,
    needleSensitivity: 0.85,
    unitSingular: "minute",
    unitPlural: "minutes",
    goalLabel: `${goal} weekly prayer minutes`,
    asOf,
    practiceTimeZone,
    daysElapsed: d,
    expectedSoFarOverride: expectedSoFar,
    paceContext: ob ? "onboarding_first_week" : "default",
  });
}
