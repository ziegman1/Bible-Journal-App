import { SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";

export function buildShareWeeklyPace(actual: number, asOf: Date = new Date()) {
  return computeWeeklyRhythmPace({
    actual,
    weeklyGoal: SHARE_WEEKLY_GOAL_ENCOUNTERS,
    needleSensitivity: 9,
    unitSingular: "share",
    unitPlural: "shares",
    goalLabel: `${SHARE_WEEKLY_GOAL_ENCOUNTERS} people shared with`,
    asOf,
  });
}
