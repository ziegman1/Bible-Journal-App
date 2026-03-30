/** Minutes logged in a week that count as “full” prayerfulness for the gauge. */
export const PRAYER_WEEKLY_GOAL_MINUTES = 60;

export function prayerfulnessPercent(weeklyMinutes: number, goalMinutes = PRAYER_WEEKLY_GOAL_MINUTES): number {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((weeklyMinutes / goalMinutes) * 100));
}
