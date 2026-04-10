import { pillarWeekDaysElapsedInclusive } from "@/lib/dashboard/pillar-week";

export type WeeklyRhythmPaceContext = "default" | "onboarding_first_week";

export type WeeklyRhythmStatus = "ahead" | "on_pace" | "behind";

export type WeeklyRhythmPaceResult = {
  weeklyGoal: number;
  daysElapsed: number;
  expectedSoFar: number;
  actual: number;
  delta: number;
  needleDegrees: number;
  status: WeeklyRhythmStatus;
  message: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Linear pace through the pillar week (Sun–Sat calendar days in pillar TZ, see `pillar-week.ts`).
 * `expectedSoFar = floor(daysElapsed * weeklyGoal / 7)` capped at goal.
 *
 * When `practiceTimeZone` is set, "today" and week length follow that IANA zone (browser cookie on web).
 */
export function expectedUnitsThroughWeek(
  daysElapsed: number,
  weeklyGoal: number
): number {
  const d = Math.min(7, Math.max(1, Math.floor(daysElapsed)));
  return Math.min(weeklyGoal, Math.floor((d * weeklyGoal) / 7));
}

/**
 * Linear pace through a 7-day window. When `onboardingFirstDayZero`, day 1 expects 0 so zero
 * activity still reads as on pace (new signup day).
 */
export function expectedUnitsForPaceDay(
  dayIndex: number,
  weeklyGoal: number,
  opts?: { onboardingFirstDayZero?: boolean }
): number {
  const d = Math.min(7, Math.max(1, Math.floor(dayIndex)));
  if (opts?.onboardingFirstDayZero && d === 1) return 0;
  return expectedUnitsThroughWeek(d, weeklyGoal);
}

/**
 * Needle: 90° = on pace, &lt; 90 behind, &gt; 90 ahead (same semantics as CHAT reading meter).
 */
export function computeWeeklyRhythmPace(input: {
  actual: number;
  weeklyGoal: number;
  /** 1–7; omit to use “today” in pillar week */
  daysElapsed?: number;
  /** IANA timezone for Sun–Sat week boundaries; omit = site default */
  practiceTimeZone?: string;
  /** When set with {@link expectedSoFarOverride}, skips recomputing expected from daysElapsed. */
  expectedSoFarOverride?: number;
  /** Copy + expected: first onboarding day can use zero expected via {@link expectedUnitsForPaceDay}. */
  paceContext?: WeeklyRhythmPaceContext;
  /** Degrees per unit of delta (sessions ~9, minutes ~0.85) */
  needleSensitivity: number;
  /** e.g. "SOAPS session" / "minute" */
  unitSingular: string;
  unitPlural: string;
  /** Goal label for messages, e.g. "5 SOAPS" / "60 prayer minutes" */
  goalLabel: string;
  asOf?: Date;
}): WeeklyRhythmPaceResult {
  const daysElapsed =
    input.daysElapsed ??
    pillarWeekDaysElapsedInclusive(input.asOf ?? new Date(), input.practiceTimeZone);
  const weeklyGoal = Math.max(0, Math.floor(input.weeklyGoal));
  const actual = Math.max(0, input.actual);
  const expectedSoFar =
    input.expectedSoFarOverride !== undefined
      ? Math.min(weeklyGoal, Math.max(0, input.expectedSoFarOverride))
      : expectedUnitsThroughWeek(daysElapsed, weeklyGoal);
  const delta = actual - expectedSoFar;

  let status: WeeklyRhythmStatus;
  if (delta > 0) status = "ahead";
  else if (delta < 0) status = "behind";
  else status = "on_pace";

  const needleDegrees = clamp(90 + delta * input.needleSensitivity, 45, 135);

  const u = (n: number) => (n === 1 ? input.unitSingular : input.unitPlural);

  const ob = input.paceContext === "onboarding_first_week";

  let message: string;
  if (status === "on_pace") {
    message = ob
      ? `You are on pace toward ${input.goalLabel} in your first week.`
      : `You are on pace toward ${input.goalLabel} this week.`;
  } else if (status === "ahead") {
    message = ob
      ? `You are ${delta} ${u(delta)} ahead of pace in your first week.`
      : `You are ${delta} ${u(delta)} ahead of pace this week.`;
  } else {
    message = ob
      ? `You are ${Math.abs(delta)} ${u(Math.abs(delta))} behind pace in your first week.`
      : `You are ${Math.abs(delta)} ${u(Math.abs(delta))} behind pace this week.`;
  }

  return {
    weeklyGoal,
    daysElapsed,
    expectedSoFar,
    actual,
    delta,
    needleDegrees,
    status,
    message,
  };
}
