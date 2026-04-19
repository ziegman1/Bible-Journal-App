import type { NormalizedSignal, PracticeType } from "@/lib/metrics/formation-momentum/types";

/**
 * Practices where rhythm is naturally **daily** (spread across the pillar week matters).
 * Scripture is split by normalization subtypes `memory_new` and `memory_review`.
 */
export const DAILY_PATTERN_PRACTICE_TYPES: readonly PracticeType[] = ["soaps", "prayer"];

export const DAILY_MEMORY_SUBTYPES = new Set<string>(["memory_new", "memory_review"]);

/**
 * Practices where the meaningful unit is **weekly participation** (CHAT check-in, 3/3 credit, shares).
 * We do not expect activity on most weekdays; penalizing “only 1–2 days” would wrongly punish legitimate use.
 */
export const WEEKLY_PATTERN_PRACTICE_TYPES: readonly PracticeType[] = ["chat", "thirds", "share"];

/**
 * v1 stepped weights for **daily-pattern** signals: map `daysWithActivity` (distinct practice days
 * in the pillar week, from normalization) → consistency factor.
 *
 * **Why not stop at 5 days?** Five active days is strong spread but still leaves 1–2 days “off” in a
 * 7-day pillar week. We reserve **full credit (1.0)** for **6–7 days** to reward a complete weekly
 * rhythm for habits meant to be daily (SOAPS, prayer, scripture memory). Five days stays at **0.95**—
 * excellent, but short of “full week” reinforcement.
 *
 * 0 days = no consistency credit. Later: streak windows, trailing 4-week coverage (config-driven).
 */
export const DEFAULT_DAILY_CONSISTENCY_BY_DAY_COUNT: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] = [
  0, // 0 days
  0.4, // 1 day
  0.6, // 2 days
  0.75, // 3 days
  0.85, // 4 days
  0.95, // 5 days — strong but not full-week
  1.0, // 6 days
  1.0, // 7 days — full pillar week coverage
];

export type ConsistencyOptions = {
  /** Override daily stepped table (length 8: indices 0–7 = 0 through 7 distinct active days). */
  dailyDayWeights?: readonly [number, number, number, number, number, number, number, number];
};

export type ConsistencyResult = {
  factor: number;
  pattern: "daily" | "weekly" | "unknown";
  /** Distinct active days used for daily pattern (from `signal.daysWithActivity`). */
  daysWithActivityUsed: number | null;
  /** Daily: tier index 0–7 matching clamped distinct-day count for the week. */
  dailyTier: number | null;
  /** Weekly: participation detected */
  weeklyHadActivity: boolean | null;
};

function isDailyPatternSignal(signal: NormalizedSignal): boolean {
  const pt = signal.practiceType;
  if (DAILY_PATTERN_PRACTICE_TYPES.includes(pt)) return true;
  if (pt === "memory") {
    const st = signal.subtype;
    return st != null && DAILY_MEMORY_SUBTYPES.has(st);
  }
  return false;
}

function isWeeklyPatternSignal(signal: NormalizedSignal): boolean {
  return WEEKLY_PATTERN_PRACTICE_TYPES.includes(signal.practiceType);
}

function dailyConsistencyFactor(
  daysWithActivity: number,
  weights: readonly [number, number, number, number, number, number, number, number]
): { factor: number; tier: number } {
  const tier = Math.max(0, Math.min(7, Math.floor(daysWithActivity)));
  const factor = weights[tier]!;
  return { factor, tier };
}

function weeklyConsistencyFactor(signal: NormalizedSignal): { factor: number; hadActivity: boolean } {
  /**
   * v1: binary participation for the week. Share may log multiple encounters (`totalUnits` > 1);
   * we still treat “any share activity this week” as full weekly consistency — volume is already in `totalUnits`.
   * Later: optional soft curve if multiple touchpoints per week should boost consistency without daily penalties.
   */
  const had = signal.totalUnits > 0 || signal.qualifyingUnits > 0;
  return { factor: had ? 1.0 : 0, hadActivity: had };
}

/**
 * Consistency modifier: practice-aware rhythm reward on {@link NormalizedSignal} rows.
 *
 * - **Daily-pattern** (`soaps`, `prayer`, `memory_new`, `memory_review`): uses `daysWithActivity`
 *   (distinct days in the pillar week) with an explicit stepped table — rewards both strong mid-week
 *   coverage (e.g. 5 days at 0.95) and **6–7 days at 1.0** as full-week rhythm for daily habits.
 * - **Weekly-pattern** (`chat`, `thirds`, `share`): binary — any participation this week → 1.0, else 0.
 *   Avoids treating “one check-in day” like “one SOAPS day.”
 */
export function applyConsistency(
  signal: NormalizedSignal,
  options?: ConsistencyOptions
): ConsistencyResult {
  const weights =
    options?.dailyDayWeights && options.dailyDayWeights.length === 8
      ? options.dailyDayWeights
      : DEFAULT_DAILY_CONSISTENCY_BY_DAY_COUNT;

  if (isDailyPatternSignal(signal)) {
    const days = signal.daysWithActivity;
    const { factor, tier } = dailyConsistencyFactor(days, weights);
    return {
      factor,
      pattern: "daily",
      daysWithActivityUsed: days,
      dailyTier: tier,
      weeklyHadActivity: null,
    };
  }

  if (isWeeklyPatternSignal(signal)) {
    const { factor, hadActivity } = weeklyConsistencyFactor(signal);
    return {
      factor,
      pattern: "weekly",
      daysWithActivityUsed: null,
      dailyTier: null,
      weeklyHadActivity: hadActivity,
    };
  }

  /** Unknown practice shape: neutral pass-through (should not occur with current normalization). */
  return {
    factor: 1,
    pattern: "unknown",
    daysWithActivityUsed: signal.daysWithActivity,
    dailyTier: null,
    weeklyHadActivity: null,
  };
}
