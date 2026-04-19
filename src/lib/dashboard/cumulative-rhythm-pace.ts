/**
 * Legacy cumulative pace helpers + **`userSignupStartYmd`** (still used as the account anchor for
 * completion gauges in `practice-completion-gauge.ts`). Home dashboard needles now use overall
 * completion **percentages** from `practice-completion-gauge.ts`, not `computeCumulativeRhythmPace`.
 * Does not feed Formation Momentum.
 */

import { formatInTimeZone } from "date-fns-tz";
import { inclusiveCalendarDaysBetween } from "@/lib/dashboard/metrics-anchor-window";
import type {
  WeeklyRhythmPaceResult,
  WeeklyRhythmStatus,
} from "@/lib/dashboard/weekly-rhythm-pace";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Calendar start of app use in practice TZ (`yyyy-MM-dd`), from Supabase `user.created_at`. */
export function userSignupStartYmd(userCreatedAt: string | null | undefined, timeZone: string): string {
  if (!userCreatedAt) {
    return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  }
  return formatInTimeZone(new Date(userCreatedAt), timeZone, "yyyy-MM-dd");
}

/**
 * Linear lifetime expectation: `weeklyGoal` units per 7 calendar days, pro-rated by elapsed days (inclusive).
 */
export function expectedCumulativeUnits(
  elapsedDays: number,
  weeklyGoal: number
): number {
  const g = Math.max(0, Number(weeklyGoal));
  const d = Math.max(1, Math.floor(elapsedDays));
  return (d / 7) * g;
}

/**
 * Map actual vs expected to the same needle band as weekly meters: ~90° = on ratio 1, 45° = low, 135° = high.
 */
export function cumulativeRatioToNeedleDegrees(actual: number, expectedTotal: number): number {
  if (expectedTotal <= 1e-9) {
    return actual > 0 ? 135 : 90;
  }
  const ratio = clamp(actual / expectedTotal, 0, 2);
  return clamp(45 + ratio * 45, 45, 135);
}

export function computeCumulativeRhythmPace(input: {
  actual: number;
  weeklyGoal: number;
  /** Inclusive start `yyyy-MM-dd` (usually signup day in practice TZ). */
  startYmd: string;
  /** Inclusive end `yyyy-MM-dd` (usually “today” in practice TZ). */
  endYmdInclusive: string;
  unitSingular: string;
  unitPlural: string;
  goalLabel: string;
}): WeeklyRhythmPaceResult {
  const weeklyGoal = Math.max(0, Math.floor(input.weeklyGoal));
  const actual = Math.max(0, input.actual);
  const elapsedDays = inclusiveCalendarDaysBetween(input.startYmd, input.endYmdInclusive);
  const expectedTotal = expectedCumulativeUnits(elapsedDays, weeklyGoal);
  const delta = actual - expectedTotal;

  let status: WeeklyRhythmStatus;
  if (delta > 0) status = "ahead";
  else if (delta < 0) status = "behind";
  else status = "on_pace";

  const needleDegrees = cumulativeRatioToNeedleDegrees(actual, expectedTotal);

  const ad = Math.abs(delta);
  const deltaDisp = (() => {
    if (input.unitPlural === "minutes") return Math.round(ad);
    if (ad < 1 && ad > 1e-6) return Math.round(ad * 10) / 10;
    return Math.round(ad);
  })();
  const unitWord = deltaDisp === 1 ? input.unitSingular : input.unitPlural;

  let message: string;
  if (status === "on_pace") {
    message = `You are on pace toward your overall ${input.goalLabel} (since you started).`;
  } else if (status === "ahead") {
    message = `You are ${deltaDisp} ${unitWord} ahead of your overall expected pace.`;
  } else {
    message = `You are ${deltaDisp} ${unitWord} behind your overall expected pace.`;
  }

  return {
    weeklyGoal,
    daysElapsed: elapsedDays,
    expectedSoFar: expectedTotal,
    actual,
    delta,
    needleDegrees,
    status,
    message,
  };
}
