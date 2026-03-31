import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";
import { DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";

/** Weekly needle pace vs weekly prayer goal (pillar week: Sun–Sat in practice timezone). */
export function buildPrayerWheelWeeklyPace(
  weeklyMinutes: number,
  asOf: Date = new Date(),
  practiceTimeZone?: string,
  weeklyGoalMinutes: number = DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES
) {
  const goal = Math.max(1, Math.floor(weeklyGoalMinutes));
  return computeWeeklyRhythmPace({
    actual: weeklyMinutes,
    weeklyGoal: goal,
    needleSensitivity: 0.85,
    unitSingular: "minute",
    unitPlural: "minutes",
    goalLabel: `${goal} weekly prayer minutes`,
    asOf,
    practiceTimeZone,
  });
}
