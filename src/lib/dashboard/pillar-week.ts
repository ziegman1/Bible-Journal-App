import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * IANA timezone for SOAPS / prayer / share / BADWR practice weekly resets.
 * Week = Sunday 00:00:00 through Saturday end of day (calendar days in this zone).
 * Override with NEXT_PUBLIC_PILLAR_WEEK_TIMEZONE.
 */
export const PILLAR_WEEK_TIMEZONE =
  process.env.NEXT_PUBLIC_PILLAR_WEEK_TIMEZONE?.trim() || "America/Chicago";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Pure calendar arithmetic on Y-M-D strings (no timezone). */
export function ymdAddCalendarDays(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const u = new Date(Date.UTC(y!, m! - 1, d!));
  u.setUTCDate(u.getUTCDate() + deltaDays);
  return `${u.getUTCFullYear()}-${pad2(u.getUTCMonth() + 1)}-${pad2(u.getUTCDate())}`;
}

/** 0 = Sunday … 6 = Saturday in `tz` (uses ISO weekday digit — not locale-dependent). */
function zonedWeekdaySun0(now: Date, tz: string): number {
  const iso = Number.parseInt(formatInTimeZone(now, tz, "i"), 10); // 1 Mon … 7 Sun
  if (iso === 7) return 0;
  return iso;
}

/**
 * Instant when the current pillar week began: Sunday 00:00:00 in {@link PILLAR_WEEK_TIMEZONE}.
 */
export function startOfPillarWeek(now: Date = new Date()): Date {
  const tz = PILLAR_WEEK_TIMEZONE;
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const wd = zonedWeekdaySun0(now, tz);
  const sundayYmd = ymdAddCalendarDays(todayYmd, -wd);
  return fromZonedTime(`${sundayYmd}T00:00:00`, tz);
}

/** Start of the *next* pillar week (exclusive end for timestamp ranges). */
export function endOfPillarWeekExclusive(now: Date = new Date()): Date {
  const start = startOfPillarWeek(now);
  const sundayYmd = formatInTimeZone(start, PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
  const nextSunday = ymdAddCalendarDays(sundayYmd, 7);
  return fromZonedTime(`${nextSunday}T00:00:00`, PILLAR_WEEK_TIMEZONE);
}

/** Last calendar day inside the pillar week (Saturday), for inclusive `DATE` filters. */
export function pillarWeekInclusiveEndYmd(now: Date = new Date()): string {
  const startYmd = formatInTimeZone(startOfPillarWeek(now), PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
  return ymdAddCalendarDays(startYmd, 6);
}

/**
 * 1–7: calendar day index within the pillar week (Sunday = 1 … Saturday = 7) in {@link PILLAR_WEEK_TIMEZONE}.
 * Uses date difference, not raw milliseconds, so DST and “day of week” are not skewed by 24h chunks.
 */
export function pillarWeekDaysElapsedInclusive(now: Date = new Date()): number {
  const tz = PILLAR_WEEK_TIMEZONE;
  const start = startOfPillarWeek(now);
  const startYmd = formatInTimeZone(start, tz, "yyyy-MM-dd");
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const [y0, m0, d0] = startYmd.split("-").map(Number);
  const [y1, m1, d1] = todayYmd.split("-").map(Number);
  const t0 = Date.UTC(y0!, m0! - 1, d0!);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const calendarDaysSinceStart = Math.floor((t1 - t0) / 86400000);
  return Math.min(7, Math.max(1, calendarDaysSinceStart + 1));
}

export function pillarWeekRangeForQuery(now: Date = new Date()): {
  startYmd: string;
  endYmdInclusive: string;
  startIso: string;
  endExclusiveIso: string;
} {
  const start = startOfPillarWeek(now);
  const tz = PILLAR_WEEK_TIMEZONE;
  const startYmd = formatInTimeZone(start, tz, "yyyy-MM-dd");
  return {
    startYmd,
    endYmdInclusive: pillarWeekInclusiveEndYmd(now),
    startIso: start.toISOString(),
    endExclusiveIso: endOfPillarWeekExclusive(now).toISOString(),
  };
}

/** Pillar-week bucket id (Sunday `yyyy-MM-dd` in pillar TZ) for a UTC instant. */
export function pillarWeekStartKeyFromInstant(inst: Date): string {
  return formatInTimeZone(startOfPillarWeek(inst), PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Pillar-week bucket for a calendar `DATE` column (treated as noon in pillar TZ to avoid boundary drift).
 */
export function pillarWeekStartKeyFromDateYmd(entryYmd: string): string {
  const ymd = entryYmd.slice(0, 10);
  const anchor = fromZonedTime(`${ymd}T12:00:00`, PILLAR_WEEK_TIMEZONE);
  return pillarWeekStartKeyFromInstant(anchor);
}

/** Every pillar-week Sunday `yyyy-MM-dd` from `firstSundayYmd` through `lastSundayYmd` inclusive. */
export function enumeratePillarWeekStartYmids(
  firstSundayYmd: string,
  lastSundayYmd: string
): string[] {
  const out: string[] = [];
  let cur = firstSundayYmd;
  while (cur <= lastSundayYmd) {
    out.push(cur);
    cur = ymdAddCalendarDays(cur, 7);
  }
  return out;
}

/** Inclusive calendar intervals `[a0,a1]` and `[b0,b1]` with `yyyy-MM-dd` strings. */
export function ymdRangesOverlap(a0: string, a1: string, b0: string, b1: string): boolean {
  return a0 <= b1 && b0 <= a1;
}
