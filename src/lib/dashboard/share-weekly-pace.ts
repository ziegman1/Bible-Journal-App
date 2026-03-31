import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";

export function buildShareWeeklyPace(
  actual: number,
  asOf: Date = new Date(),
  practiceTimeZone?: string,
  weeklyGoalEncounters: number = DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS
) {
  const goal = Math.max(1, Math.floor(weeklyGoalEncounters));
  return computeWeeklyRhythmPace({
    actual,
    weeklyGoal: goal,
    needleSensitivity: 9,
    unitSingular: "share",
    unitPlural: "shares",
    goalLabel: `${goal} people shared with`,
    asOf,
    practiceTimeZone,
  });
}
