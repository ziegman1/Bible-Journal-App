import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { FALLBACK_PRACTICE_TIMEZONE } from "@/lib/timezone/practice-timezone-shared";

/**
 * Default IANA timezone for SOAPS / prayer / share / BADWR practice weeks when no per-user
 * cookie is set (see {@link getPracticeTimeZone}, {@link PracticeTimeZoneSync}).
 * Week = Sunday 00:00:00 through Saturday (calendar days in this zone). DST is automatic.
 */
export const PILLAR_WEEK_TIMEZONE = FALLBACK_PRACTICE_TIMEZONE;

function resolveTz(timeZone?: string): string {
  const z = timeZone?.trim();
  if (z) return z;
  return PILLAR_WEEK_TIMEZONE;
}

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

/** 0 = Sunday … 6 = Saturday in `tz`. */
function zonedWeekdaySun0(now: Date, tz: string): number {
  const iso = Number.parseInt(formatInTimeZone(now, tz, "i"), 10); // 1 Mon … 7 Sun
  if (iso === 7) return 0;
  return iso;
}

/**
 * Instant when the current pillar week began: Sunday 00:00:00 in the practice timezone.
 */
export function startOfPillarWeek(now: Date = new Date(), timeZone?: string): Date {
  const tz = resolveTz(timeZone);
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const wd = zonedWeekdaySun0(now, tz);
  const sundayYmd = ymdAddCalendarDays(todayYmd, -wd);
  return fromZonedTime(`${sundayYmd}T00:00:00`, tz);
}

/** Start of the next pillar week (exclusive end for timestamp ranges). */
export function endOfPillarWeekExclusive(now: Date = new Date(), timeZone?: string): Date {
  const tz = resolveTz(timeZone);
  const start = startOfPillarWeek(now, tz);
  const sundayYmd = formatInTimeZone(start, tz, "yyyy-MM-dd");
  const nextSunday = ymdAddCalendarDays(sundayYmd, 7);
  return fromZonedTime(`${nextSunday}T00:00:00`, tz);
}

/** Last calendar day inside the pillar week (Saturday). */
export function pillarWeekInclusiveEndYmd(now: Date = new Date(), timeZone?: string): string {
  const tz = resolveTz(timeZone);
  const startYmd = formatInTimeZone(startOfPillarWeek(now, tz), tz, "yyyy-MM-dd");
  return ymdAddCalendarDays(startYmd, 6);
}

/**
 * 1–7: Sunday = 1 … Saturday = 7 in the practice timezone.
 */
export function pillarWeekDaysElapsedInclusive(
  now: Date = new Date(),
  timeZone?: string
): number {
  const tz = resolveTz(timeZone);
  const start = startOfPillarWeek(now, tz);
  const startYmd = formatInTimeZone(start, tz, "yyyy-MM-dd");
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const [y0, m0, d0] = startYmd.split("-").map(Number);
  const [y1, m1, d1] = todayYmd.split("-").map(Number);
  const t0 = Date.UTC(y0!, m0! - 1, d0!);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const calendarDaysSinceStart = Math.floor((t1 - t0) / 86400000);
  return Math.min(7, Math.max(1, calendarDaysSinceStart + 1));
}

export function pillarWeekRangeForQuery(
  now: Date = new Date(),
  timeZone?: string
): {
  startYmd: string;
  endYmdInclusive: string;
  startIso: string;
  endExclusiveIso: string;
} {
  const tz = resolveTz(timeZone);
  const start = startOfPillarWeek(now, tz);
  const startYmd = formatInTimeZone(start, tz, "yyyy-MM-dd");
  return {
    startYmd,
    endYmdInclusive: pillarWeekInclusiveEndYmd(now, tz),
    startIso: start.toISOString(),
    endExclusiveIso: endOfPillarWeekExclusive(now, tz).toISOString(),
  };
}

/** Pillar-week bucket id (Sunday `yyyy-MM-dd` in practice TZ) for an instant. */
export function pillarWeekStartKeyFromInstant(
  inst: Date,
  timeZone?: string
): string {
  const tz = resolveTz(timeZone);
  return formatInTimeZone(startOfPillarWeek(inst, tz), tz, "yyyy-MM-dd");
}

/**
 * Pillar week for a calendar `DATE` (noon in practice TZ avoids boundary drift).
 */
export function pillarWeekStartKeyFromDateYmd(entryYmd: string, timeZone?: string): string {
  const tz = resolveTz(timeZone);
  const ymd = entryYmd.slice(0, 10);
  const anchor = fromZonedTime(`${ymd}T12:00:00`, tz);
  return pillarWeekStartKeyFromInstant(anchor, tz);
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
