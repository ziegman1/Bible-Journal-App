import {
  enumeratePillarWeekStartYmids,
  pillarWeekStartKeyFromDateYmd,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";

/**
 * Pillar-week Sunday keys from the week containing `signupYmd` through the week containing `todayYmd` (inclusive).
 */
export function pillarWeekStartsFromSignupThroughToday(
  signupYmd: string,
  todayYmd: string,
  tz: string
): string[] {
  const firstSunday = pillarWeekStartKeyFromDateYmd(signupYmd, tz);
  const lastSunday = pillarWeekStartKeyFromDateYmd(todayYmd, tz);
  if (firstSunday > lastSunday) return [lastSunday];
  const list = enumeratePillarWeekStartYmids(firstSunday, lastSunday);
  return list.length > 0 ? list : [lastSunday];
}

/** Count calendar days in [startYmd, endYmdInclusive] that appear in `set`. */
export function countDaysInRangeInSet(
  set: Set<string>,
  startYmd: string,
  endYmdInclusive: string
): number {
  let n = 0;
  let d = startYmd;
  while (d <= endYmdInclusive) {
    if (set.has(d)) n++;
    d = ymdAddCalendarDays(d, 1);
  }
  return n;
}

/**
 * Home **practice gauge** layer: completion **percentages** since account start (presentation only).
 *
 * This is separate from Formation Momentum (Foundation / Formation / Reproduction) and from legacy
 * cumulative-pace math. Needles map **0–100%** completion linearly onto the same arc as other pace meters.
 *
 * **Partial periods (v1):**
 * - **Daily models:** Denominator = every calendar day from signup through **today** (inclusive).
 *   Today counts as a full day in the denominator; the numerator includes today only if that day already
 *   has qualifying activity. No “fraction of a day” — consistent with “% of days completed so far.”
 * - **Weekly models:** Denominator = every **pillar week** (Sunday start) from the week containing signup
 *   through the week containing today. The **current** week counts as one full week in the denominator;
 *   it counts as “completed” only if the user already has a completion record for that week (check-in /
 *   finalized week / etc.). Mid-week, incomplete weeks lower the % until the user completes.
 * - **Share (goal average):** Each pillar week contributes `min(100%, actual/goal × 100)`; weeks with zero
 *   encounters contribute 0%. The current partial week uses encounters logged **so far** in that week.
 */

import type { WeeklyRhythmStatus } from "@/lib/dashboard/weekly-rhythm-pace";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Map 0–100% completion to the pace meter arc (45° = 0%, 135° = 100%). */
export function completionPercentToNeedleDegrees(percent: number): number {
  const p = clamp(percent, 0, 100);
  return 45 + (p / 100) * 90;
}

export function completionStatusFromPercent(percent: number): WeeklyRhythmStatus {
  if (percent >= 85) return "ahead";
  if (percent >= 50) return "on_pace";
  return "behind";
}

export type PracticeCompletionGaugeVm = {
  /** 0–100 */
  completionPercent: number;
  needleDegrees: number;
  status: WeeklyRhythmStatus;
  message: string;
};

export function buildDailyCompletionGauge(
  completedDays: number,
  totalDays: number,
  practiceLabel: string
): PracticeCompletionGaugeVm {
  const td = Math.max(1, totalDays);
  const cd = clamp(completedDays, 0, td);
  const pct = (cd / td) * 100;
  const completionPercent = Math.round(pct * 10) / 10;
  return {
    completionPercent,
    needleDegrees: completionPercentToNeedleDegrees(completionPercent),
    status: completionStatusFromPercent(completionPercent),
    message: `Overall ${practiceLabel}: ${cd} of ${td} days (${completionPercent}%).`,
  };
}

export function buildWeeklyCompletionGauge(
  completedWeeks: number,
  totalWeeks: number,
  practiceLabel: string
): PracticeCompletionGaugeVm {
  const tw = Math.max(1, totalWeeks);
  const cw = clamp(completedWeeks, 0, tw);
  const pct = (cw / tw) * 100;
  const completionPercent = Math.round(pct * 10) / 10;
  return {
    completionPercent,
    needleDegrees: completionPercentToNeedleDegrees(completionPercent),
    status: completionStatusFromPercent(completionPercent),
    message: `Overall ${practiceLabel}: ${cw} of ${tw} pillar weeks (${completionPercent}%).`,
  };
}

export function buildShareAverageWeeklyGauge(
  averageWeeklyPercent: number
): PracticeCompletionGaugeVm {
  const completionPercent = Math.round(clamp(averageWeeklyPercent, 0, 100) * 10) / 10;
  return {
    completionPercent,
    needleDegrees: completionPercentToNeedleDegrees(completionPercent),
    status: completionStatusFromPercent(completionPercent),
    message: `Average weekly share goal completion: ${completionPercent}% (since you started).`,
  };
}
