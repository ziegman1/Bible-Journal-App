import {
  pillarWeekDaysElapsedInclusive,
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import { formatInTimeZone } from "date-fns-tz";
import { parseWeekWindowKey } from "@/lib/metrics/formation-momentum/modifiers/recency";
import type { GraceReason, NormalizedSignal } from "@/lib/metrics/formation-momentum/types";

/**
 * Grace is a **bounded fairness layer**, not score inflation: it nudges multipliers up slightly when
 * the raw weekly signal would misread onboarding timing, an incomplete pillar week, or a return after
 * a quiet week as “failure.” The ceiling keeps chronic disengagement from being hidden.
 */
export const GRACE_FACTOR_MIN = 1.0;
/** Hard ceiling — situational bonuses stack additively then clamp here (not multiplicative runaway). */
export const GRACE_FACTOR_CAP = 1.15;

/** Overlap between this signal’s pillar week and the user’s first 7 local days after signup. */
const BONUS_ONBOARDING_WEEK_OVERLAP = 0.06;
/** Current pillar week, first few calendar days: activity counts are still accumulating. */
const BONUS_PARTIAL_WEEK_EARLY = 0.04;
/** Current week shows activity again after this practice row was quiet last pillar week. */
const BONUS_RE_ENGAGEMENT = 0.05;

/** First N days of the pillar week (Sun=1 …) eligible for partial-week grace. */
const PARTIAL_WEEK_MAX_DAY_INDEX_INCLUSIVE = 3;

export type GraceOptions = {
  timeZone: string;
  now: Date;
  /** `auth.users.created_at` ISO string when available (same anchor family as metrics windows). */
  userCreatedAt: string | null;
  /**
   * When set (e.g. after metrics reset), onboarding-window grace uses this `yyyy-MM-dd` instead of
   * deriving signup from `userCreatedAt`.
   */
  graceSignupYmd?: string | null;
  /** Pillar weeks ago for this signal (align with recency). */
  signalWeeksAgo: number;
  /**
   * Full normalized batch for this run — used to detect prior-week activity for the **same**
   * practice identity (`practiceType` + `subtype`).
   */
  allSignals: readonly NormalizedSignal[];
};

export type GraceResult = {
  factor: number;
  reasons: GraceReason[];
  /** Capped uplift from 1.0 (`factor - 1` after clamp). */
  bonusApplied: number;
};

function samePracticeIdentity(a: NormalizedSignal, b: NormalizedSignal): boolean {
  return a.practiceType === b.practiceType && (a.subtype ?? "") === (b.subtype ?? "");
}

function priorPillarWeekKey(now: Date, timeZone: string): string {
  const currentSun = pillarWeekStartKeyFromInstant(now, timeZone);
  const priorSun = ymdAddCalendarDays(currentSun, -7);
  return `week:${priorSun}`;
}

/**
 * True if any row in `allSignals` for `priorWeekKey` matches `signal` practice identity with volume.
 */
export function priorWeekHadPracticeActivity(
  allSignals: readonly NormalizedSignal[],
  signal: NormalizedSignal,
  priorWeekKey: string
): boolean {
  return allSignals.some(
    (s) =>
      s.windowKey === priorWeekKey &&
      samePracticeIdentity(s, signal) &&
      s.totalUnits > 0
  );
}

/**
 * True if the pillar week `[signalWeekStart, +6]` intersects the onboarding interval `[signup, signup+6]`.
 * Aligns with the spirit of {@link getMetricsAnchorWindow} first-seven-days logic.
 */
export function signalWeekOverlapsOnboardingWindow(
  signalWeekStartSundayYmd: string,
  signupYmd: string
): boolean {
  const weekEnd = ymdAddCalendarDays(signalWeekStartSundayYmd, 6);
  const onboardEnd = ymdAddCalendarDays(signupYmd, 6);
  return signalWeekStartSundayYmd <= onboardEnd && weekEnd >= signupYmd;
}

/**
 * Fairness / mercy multiplier (≥ 1, capped). Applied **after** recency, consistency, and goal alignment
 * in the engine product — it does not replace those signals.
 */
export function applyGrace(signal: NormalizedSignal, options: GraceOptions): GraceResult {
  const { timeZone, now, userCreatedAt, graceSignupYmd, signalWeeksAgo, allSignals } = options;
  const reasons: GraceReason[] = [];

  let bonus = 0;

  const parsed = parseWeekWindowKey(signal.windowKey);
  const signalWeekStartYmd = parsed?.sundayYmd ?? null;

  const resolvedSignupYmd =
    graceSignupYmd?.trim().slice(0, 10) ??
    (userCreatedAt
      ? formatInTimeZone(new Date(userCreatedAt), timeZone, "yyyy-MM-dd")
      : null);

  if (resolvedSignupYmd && /^\d{4}-\d{2}-\d{2}$/.test(resolvedSignupYmd) && signalWeekStartYmd) {
    if (signalWeekOverlapsOnboardingWindow(signalWeekStartYmd, resolvedSignupYmd)) {
      bonus += BONUS_ONBOARDING_WEEK_OVERLAP;
      reasons.push({
        kind: "onboarding_window_overlap",
        signupYmd: resolvedSignupYmd,
        signalWeekStartYmd,
      });
    }
  }

  if (signalWeeksAgo === 0) {
    const dayIndex = pillarWeekDaysElapsedInclusive(now, timeZone);
    if (dayIndex <= PARTIAL_WEEK_MAX_DAY_INDEX_INCLUSIVE) {
      bonus += BONUS_PARTIAL_WEEK_EARLY;
      reasons.push({ kind: "partial_week_early", pillarDayIndex: dayIndex });
    }
  }

  if (signalWeeksAgo === 0 && signal.totalUnits > 0) {
    const priorKey = priorPillarWeekKey(now, timeZone);
    if (!priorWeekHadPracticeActivity(allSignals, signal, priorKey)) {
      bonus += BONUS_RE_ENGAGEMENT;
      reasons.push({ kind: "re_engagement", priorWeekKey: priorKey });
    }
  }

  if (reasons.length === 0) {
    reasons.push({ kind: "none" });
  }

  const rawFactor = 1 + bonus;
  const factor = Math.max(GRACE_FACTOR_MIN, Math.min(GRACE_FACTOR_CAP, rawFactor));
  const bonusApplied = factor - 1;

  return { factor, reasons, bonusApplied };
}
