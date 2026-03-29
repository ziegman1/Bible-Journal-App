/** Monday-start week in UTC (matches prayer wheel weekly stats). */

export function startOfUtcWeekMonday(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
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

/** Inclusive day index within the UTC week: Monday = 1 … Sunday = 7. */
export function utcWeekDaysElapsedInclusive(now: Date = new Date()): number {
  const start = startOfUtcWeekMonday(now);
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Math.floor((endUtc - start.getTime()) / 86400000);
  return Math.min(7, Math.max(1, diff + 1));
}

export function utcDateYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
