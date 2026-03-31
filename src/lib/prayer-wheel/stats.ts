/** Default weekly prayer minutes when profile has no override. */
export const DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES = 60;

/**
 * @deprecated Use profile `weekly_prayer_goal_minutes` via `fetchUserRhythmGoals`; kept for default args.
 */
export const PRAYER_WEEKLY_GOAL_MINUTES = DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES;

export function prayerfulnessPercent(weeklyMinutes: number, goalMinutes = PRAYER_WEEKLY_GOAL_MINUTES): number {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((weeklyMinutes / goalMinutes) * 100));
}
