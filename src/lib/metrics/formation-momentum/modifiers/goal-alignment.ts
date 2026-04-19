import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import type { GoalAlignmentMode, NormalizedSignal } from "@/lib/metrics/formation-momentum/types";

/**
 * Default qualifying SOAPS sessions per pillar week (matches `SOAPS_WEEKLY_GOAL_SESSIONS` / BADWR pace).
 * v1 hard-coded until profile column exists.
 */
export const DEFAULT_SOAPS_WEEKLY_QUALIFYING_GOAL = 5;

/**
 * Converts `monthly_new_passages_goal` to an approximate **weekly** new-passage target.
 * Uses ÷4 as a simple “~4 weeks per month” rule (calendar months vary; future: prorate by days in month
 * or by pillar weeks overlapping the month).
 */
export function weeklyNewPassagesTargetFromMonthly(monthlyNewPassagesGoal: number): number {
  const m = Math.max(0, monthlyNewPassagesGoal);
  if (m <= 0) return 0;
  return m / 4;
}

/**
 * Weekly review-passage target from `daily_review_goal` (same units as normalization `totalUnits` for review).
 * Assumes roughly **7×** daily expectation rolled into the pillar week.
 */
export function weeklyReviewPassagesTargetFromDaily(dailyReviewGoal: number): number {
  const d = Math.max(0, dailyReviewGoal);
  return d * 7;
}

/**
 * Raw ratio = actual / target. We cap modest overperformance so outliers don’t dominate the matrix.
 * Under-target scales linearly; at/above target approaches 1; above ~1.15–1.2 plateaus.
 */
export const GOAL_ALIGNMENT_OVERPERFORMANCE_CAP = 1.15;

/**
 * All targets the modifier understands for v1 (from profile / scripture settings + SOAPS default).
 * Loaded once per engine run and passed on each `applyGoalAlignment` call.
 */
export type GoalAlignmentInputGoals = {
  soapsWeeklyQualifyingGoal: number;
  prayerWeeklyMinutesGoal: number;
  shareWeeklyEncountersGoal: number;
  scriptureMonthlyNewPassagesGoal: number;
  scriptureDailyReviewGoal: number;
};

export type GoalAlignmentOptions = {
  goals: GoalAlignmentInputGoals;
};

export type GoalAlignmentResult = {
  factor: number;
  /** Value compared to the goal (e.g. qualifying count, minutes, encounters). */
  actual: number | null;
  /** Weekly (or weekly-equivalent) target used for ratio; null when not applicable. */
  goalTargetUsed: number | null;
  /** `actual / goalTargetUsed` before cap; null if no ratio. */
  rawRatio: number | null;
  /** Which branch ran (debug / UI). */
  mode: GoalAlignmentMode;
};

function ratioToAlignmentFactor(actual: number, target: number): { factor: number; rawRatio: number } {
  if (target <= 0) {
    return { factor: 1, rawRatio: 1 };
  }
  if (actual <= 0) {
    return { factor: 0, rawRatio: 0 };
  }
  const rawRatio = actual / target;
  const factor = Math.min(GOAL_ALIGNMENT_OVERPERFORMANCE_CAP, rawRatio);
  return { factor, rawRatio };
}

/**
 * Goal alignment: `actual / weeklyTarget`, linear below target, capped modestly above 1.0.
 *
 * Practices **without** v1 goals (CHAT, 3/3rds) pass through with factor **1** and `neutral_no_goal`.
 */
export function applyGoalAlignment(
  signal: NormalizedSignal,
  options: GoalAlignmentOptions
): GoalAlignmentResult {
  const g = options.goals;
  const pt = signal.practiceType;
  const st = signal.subtype;

  if (pt === "soaps") {
    const actual = signal.qualifyingUnits;
    const target = g.soapsWeeklyQualifyingGoal;
    const { factor, rawRatio } = ratioToAlignmentFactor(actual, target);
    return {
      factor,
      actual,
      goalTargetUsed: target,
      rawRatio,
      mode: "soaps_qualifying",
    };
  }

  if (pt === "prayer") {
    const actual = signal.totalUnits;
    const target = g.prayerWeeklyMinutesGoal;
    const { factor, rawRatio } = ratioToAlignmentFactor(actual, target);
    return {
      factor,
      actual,
      goalTargetUsed: target,
      rawRatio,
      mode: "prayer_minutes",
    };
  }

  if (pt === "share") {
    const actual = signal.totalUnits;
    const target = g.shareWeeklyEncountersGoal;
    const { factor, rawRatio } = ratioToAlignmentFactor(actual, target);
    return {
      factor,
      actual,
      goalTargetUsed: target,
      rawRatio,
      mode: "share_encounters",
    };
  }

  if (pt === "memory" && st === "memory_new") {
    const actual = signal.totalUnits;
    const target = weeklyNewPassagesTargetFromMonthly(g.scriptureMonthlyNewPassagesGoal);
    const { factor, rawRatio } = ratioToAlignmentFactor(actual, target);
    return {
      factor,
      actual,
      goalTargetUsed: target,
      rawRatio,
      mode: "memory_new",
    };
  }

  if (pt === "memory" && st === "memory_review") {
    const actual = signal.totalUnits;
    const target = weeklyReviewPassagesTargetFromDaily(g.scriptureDailyReviewGoal);
    const { factor, rawRatio } = ratioToAlignmentFactor(actual, target);
    return {
      factor,
      actual,
      goalTargetUsed: target,
      rawRatio,
      mode: "memory_review",
    };
  }

  return {
    factor: 1,
    actual: null,
    goalTargetUsed: null,
    rawRatio: null,
    mode: "neutral_no_goal",
  };
}

const DEFAULT_SCRIPTURE_MONTHLY_NEW = 5;
const DEFAULT_SCRIPTURE_DAILY_REVIEW = 5;

/** Fallback when Supabase is unavailable (matches app defaults from rhythm + scripture settings). */
export function defaultGoalAlignmentInputGoals(): GoalAlignmentInputGoals {
  return {
    soapsWeeklyQualifyingGoal: DEFAULT_SOAPS_WEEKLY_QUALIFYING_GOAL,
    prayerWeeklyMinutesGoal: DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES,
    shareWeeklyEncountersGoal: DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS,
    scriptureMonthlyNewPassagesGoal: DEFAULT_SCRIPTURE_MONTHLY_NEW,
    scriptureDailyReviewGoal: DEFAULT_SCRIPTURE_DAILY_REVIEW,
  };
}

/**
 * Load profile + scripture settings for goal alignment (call from server `engine` once per run).
 */
export async function loadGoalAlignmentInputGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<GoalAlignmentInputGoals> {
  const [rhythm, scriptureRes] = await Promise.all([
    fetchUserRhythmGoals(supabase, userId),
    supabase
      .from("scripture_memory_settings")
      .select("monthly_new_passages_goal, daily_review_goal")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const sm = scriptureRes.data;
  const monthlyNew =
    typeof sm?.monthly_new_passages_goal === "number" && Number.isFinite(sm.monthly_new_passages_goal)
      ? Math.max(0, sm.monthly_new_passages_goal)
      : DEFAULT_SCRIPTURE_MONTHLY_NEW;
  const dailyRev =
    typeof sm?.daily_review_goal === "number" && Number.isFinite(sm.daily_review_goal)
      ? Math.max(0, sm.daily_review_goal)
      : DEFAULT_SCRIPTURE_DAILY_REVIEW;

  return {
    soapsWeeklyQualifyingGoal: DEFAULT_SOAPS_WEEKLY_QUALIFYING_GOAL,
    prayerWeeklyMinutesGoal: rhythm.prayerWeeklyGoalMinutes,
    shareWeeklyEncountersGoal: rhythm.shareWeeklyGoalEncounters,
    scriptureMonthlyNewPassagesGoal: monthlyNew,
    scriptureDailyReviewGoal: dailyRev,
  };
}
