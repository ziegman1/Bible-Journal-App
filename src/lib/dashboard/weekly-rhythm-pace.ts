import { utcWeekDaysElapsedInclusive } from "@/lib/dashboard/utc-week";

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
 * Linear pace through the week: by Sunday you should reach `weeklyGoal`.
 * `expectedSoFar = floor(daysElapsed * weeklyGoal / 7)` capped at goal.
 */
export function expectedUnitsThroughWeek(
  daysElapsed: number,
  weeklyGoal: number
): number {
  const d = Math.min(7, Math.max(1, Math.floor(daysElapsed)));
  return Math.min(weeklyGoal, Math.floor((d * weeklyGoal) / 7));
}

/**
 * Needle: 90° = on pace, &lt; 90 behind, &gt; 90 ahead (same semantics as CHAT reading meter).
 */
export function computeWeeklyRhythmPace(input: {
  actual: number;
  weeklyGoal: number;
  /** 1–7; omit to use “today” in UTC week */
  daysElapsed?: number;
  /** Degrees per unit of delta (sessions ~9, minutes ~0.85) */
  needleSensitivity: number;
  /** e.g. "SOAPS session" / "minute" */
  unitSingular: string;
  unitPlural: string;
  /** Goal label for messages, e.g. "5 SOAPS" / "60 prayer minutes" */
  goalLabel: string;
  asOf?: Date;
}): WeeklyRhythmPaceResult {
  const daysElapsed = input.daysElapsed ?? utcWeekDaysElapsedInclusive(input.asOf ?? new Date());
  const weeklyGoal = Math.max(0, Math.floor(input.weeklyGoal));
  const actual = Math.max(0, input.actual);
  const expectedSoFar = expectedUnitsThroughWeek(daysElapsed, weeklyGoal);
  const delta = actual - expectedSoFar;

  let status: WeeklyRhythmStatus;
  if (delta > 0) status = "ahead";
  else if (delta < 0) status = "behind";
  else status = "on_pace";

  const needleDegrees = clamp(90 + delta * input.needleSensitivity, 45, 135);

  const u = (n: number) => (n === 1 ? input.unitSingular : input.unitPlural);

  let message: string;
  if (status === "on_pace") {
    message = `You are on pace toward ${input.goalLabel} this week.`;
  } else if (status === "ahead") {
    message = `You are ${delta} ${u(delta)} ahead of pace this week.`;
  } else {
    message = `You are ${Math.abs(delta)} ${u(Math.abs(delta))} behind pace this week.`;
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
