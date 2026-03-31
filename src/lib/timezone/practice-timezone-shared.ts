import { formatInTimeZone } from "date-fns-tz";

/** Cookie the client sets so server actions use the same IANA zone as the device. */
export const PRACTICE_TIMEZONE_COOKIE = "badwr_practice_tz";

/**
 * Default when cookie missing/invalid — same env as historical `pillar-week` default.
 * IANA IDs follow daylight saving rules automatically (no manual DST toggle).
 */
export const FALLBACK_PRACTICE_TIMEZONE =
  process.env.NEXT_PUBLIC_PILLAR_WEEK_TIMEZONE?.trim() || "America/Chicago";

/**
 * Returns `candidate` if it is a valid IANA timezone for `date-fns-tz`, else `fallback`.
 */
export function normalizePracticeTimeZone(
  candidate: string | undefined | null,
  fallback: string = FALLBACK_PRACTICE_TIMEZONE
): string {
  const s = candidate?.trim();
  if (!s || s.length < 3 || s.length > 120) return fallback;
  try {
    formatInTimeZone(new Date(), s, "yyyy-MM-dd");
    return s;
  } catch {
    return fallback;
  }
}
