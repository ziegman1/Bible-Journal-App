import {
  PILLAR_WEEK_TIMEZONE,
  pillarWeekStartKeyFromInstant,
} from "@/lib/dashboard/pillar-week";
import type { NormalizedSignal } from "@/lib/metrics/formation-momentum/types";

const WEEK_PREFIX = "week:";

/**
 * v1 stepped recency weights by whole pillar-week distance from the current week.
 * Index = weeks ago (0 = current pillar week). 4+ weeks use the floor weight.
 *
 * Chosen as an explicit table (not continuous decay) so tuning and A/B configs are easy to read
 * and match product expectations. Later: load from remote config / env while keeping this as default.
 */
export const DEFAULT_RECENCY_WEIGHTS_BY_WEEKS_AGO: readonly [number, number, number, number, number] = [
  1.0, // current week
  0.85, // 1 week ago
  0.7, // 2 weeks ago
  0.55, // 3 weeks ago
  0.4, // 4+ weeks ago
];

export type RecencyOptions = {
  /** Reference instant; defaults to `new Date()`. */
  now?: Date;
  /**
   * Practice timezone for the current pillar week anchor (same as normalization / ingestion).
   * Defaults to {@link PILLAR_WEEK_TIMEZONE}.
   */
  timeZone?: string;
  /**
   * Override stepped weights `[w0, w1, w2, w3, w4plus]` — must have length 5; last is used for 4+ weeks ago.
   */
  weights?: readonly [number, number, number, number, number];
};

export type RecencyResult = {
  /** Multiplier applied to base value (totalUnits). */
  factor: number;
  /** Whole pillar weeks between this signal’s week start and the current pillar week start (0 = this week). */
  weeksAgo: number;
  /** Sunday `yyyy-MM-dd` of the pillar week containing `now`. */
  currentPillarWeekStartYmd: string;
  /** Sunday `yyyy-MM-dd` parsed from `signal.windowKey`, or null if invalid. */
  signalPillarWeekStartYmd: string | null;
};

/**
 * Parse `windowKey` values of the form `week:yyyy-MM-dd` (pillar-week Sunday in practice TZ).
 * Returns null if malformed (wrong prefix or date shape).
 */
export function parseWeekWindowKey(windowKey: string): { sundayYmd: string } | null {
  if (!windowKey.startsWith(WEEK_PREFIX)) return null;
  const rest = windowKey.slice(WEEK_PREFIX.length).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rest)) return null;
  return { sundayYmd: rest };
}

function utcMidnightYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/**
 * Signed calendar-day distance from `a` to `b` (both `yyyy-MM-dd`), UTC date arithmetic.
 * e.g. `calendarDaysBetweenYmd("2026-03-23", "2026-03-30")` → 7.
 */
export function calendarDaysBetweenYmd(a: string, b: string): number {
  return Math.round((utcMidnightYmd(b) - utcMidnightYmd(a)) / 86400000);
}

/**
 * Whole pillar weeks “ago” the signal week is relative to the current pillar week.
 *
 * **Computation:** Both week starts are Sunday `yyyy-MM-dd` strings. We take calendar-day difference
 * from signal Sunday to current Sunday, divide by 7, floor. Future signal weeks (negative difference)
 * clamp to `0` so they receive the current-week weight (no double-penalty for data quirks).
 */
export function pillarWeeksAgo(
  signalPillarSundayYmd: string,
  currentPillarSundayYmd: string
): number {
  const days = calendarDaysBetweenYmd(signalPillarSundayYmd, currentPillarSundayYmd);
  if (days < 0) return 0;
  return Math.floor(days / 7);
}

function recencyFactorForWeeksAgo(
  weeksAgo: number,
  weights: readonly [number, number, number, number, number]
): number {
  const w = weeksAgo < 0 ? 0 : weeksAgo;
  if (w < 4) return weights[w]!;
  return weights[4]!;
}

/**
 * Recency modifier: down-weights normalized signals from older pillar weeks using a stepped table.
 *
 * Operates only on {@link NormalizedSignal} rows (post-normalization). Uses the same pillar-week
 * model as {@link pillarWeekStartKeyFromInstant} / normalization `week:*` keys.
 */
export function applyRecency(
  signal: NormalizedSignal,
  options?: RecencyOptions
): RecencyResult {
  const now = options?.now ?? new Date();
  const tz = options?.timeZone?.trim() || PILLAR_WEEK_TIMEZONE;
  const weights =
    options?.weights && options.weights.length === 5
      ? options.weights
      : DEFAULT_RECENCY_WEIGHTS_BY_WEEKS_AGO;

  const currentPillarWeekStartYmd = pillarWeekStartKeyFromInstant(now, tz);

  const parsed = parseWeekWindowKey(signal.windowKey);
  if (!parsed) {
    return {
      factor: weights[4]!,
      /** Unparseable key: same weight as 4+ weeks; use `signalPillarWeekStartYmd === null` to detect. */
      weeksAgo: 4,
      currentPillarWeekStartYmd,
      signalPillarWeekStartYmd: null,
    };
  }

  const weeksAgo = pillarWeeksAgo(parsed.sundayYmd, currentPillarWeekStartYmd);
  const factor = recencyFactorForWeeksAgo(weeksAgo, weights);

  return {
    factor,
    weeksAgo,
    currentPillarWeekStartYmd,
    signalPillarWeekStartYmd: parsed.sundayYmd,
  };
}
