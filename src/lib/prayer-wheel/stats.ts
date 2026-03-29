/** Minutes logged in a week that count as “full” prayerfulness for the gauge. */
export const PRAYER_WEEKLY_GOAL_MINUTES = 60;

export function startOfUtcWeekMonday(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfUtcWeekMonday(now: Date = new Date()): Date {
  const start = startOfUtcWeekMonday(now);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return end;
}

export function prayerfulnessPercent(weeklyMinutes: number, goalMinutes = PRAYER_WEEKLY_GOAL_MINUTES): number {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((weeklyMinutes / goalMinutes) * 100));
}
