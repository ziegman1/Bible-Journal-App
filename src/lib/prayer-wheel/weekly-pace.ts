import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";
import { PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";

/** Weekly needle pace vs weekly prayer goal (pillar week: Sun 00:00–Sat, configured TZ). */
export function buildPrayerWheelWeeklyPace(weeklyMinutes: number, asOf: Date = new Date()) {
  return computeWeeklyRhythmPace({
    actual: weeklyMinutes,
    weeklyGoal: PRAYER_WEEKLY_GOAL_MINUTES,
    needleSensitivity: 0.85,
    unitSingular: "minute",
    unitPlural: "minutes",
    goalLabel: `${PRAYER_WEEKLY_GOAL_MINUTES} weekly prayer minutes`,
    asOf,
  });
}
