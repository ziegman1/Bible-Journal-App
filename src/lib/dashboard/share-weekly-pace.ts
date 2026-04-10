import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import {
  computeWeeklyRhythmPace,
  expectedUnitsForPaceDay,
} from "@/lib/dashboard/weekly-rhythm-pace";

export function buildShareWeeklyPace(
  actual: number,
  asOf: Date = new Date(),
  practiceTimeZone?: string,
  weeklyGoalEncounters: number = DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS,
  opts?: {
    anchorDayIndex?: number;
    onboardingFirstWeek?: boolean;
  }
) {
  const goal = Math.max(1, Math.floor(weeklyGoalEncounters));
  const ob = opts?.onboardingFirstWeek ?? false;
  const d = opts?.anchorDayIndex;
  const expectedSoFar =
    d != null
      ? expectedUnitsForPaceDay(d, goal, { onboardingFirstDayZero: ob })
      : undefined;

  return computeWeeklyRhythmPace({
    actual,
    weeklyGoal: goal,
    needleSensitivity: 9,
    unitSingular: "share",
    unitPlural: "shares",
    goalLabel: `${goal} people shared with`,
    asOf,
    practiceTimeZone,
    daysElapsed: d,
    expectedSoFarOverride: expectedSoFar,
    paceContext: ob ? "onboarding_first_week" : "default",
  });
}
