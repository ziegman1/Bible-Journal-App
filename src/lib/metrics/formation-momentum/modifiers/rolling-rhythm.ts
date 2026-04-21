/**
 * **Rolling family rhythm (v1)** — soft, capped multipliers on **category masses** after the main modifier
 * chain and matrix+sharing math. This is **not** a brittle streak reset: each of the last 6 pillar weeks
 * contributes a small score (0 / 0.5 / 1), averaged, then mapped to modest `1 + cap × score` multipliers
 * applied **per pillar** so volume, recency, and progression-gate still dominate.
 *
 * - Strongest lift on **Formation**; lighter on **Foundation**; **Reproduction** stays neutral (multiplier 1).
 * - Applied **after** share drag, **before** progression gate so gates still shape final emergence.
 */

import {
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import type { GoalAlignmentInputGoals } from "@/lib/metrics/formation-momentum/modifiers/goal-alignment";
import type { NormalizedSignal } from "@/lib/metrics/formation-momentum/types";

/** Trailing pillar weeks evaluated (including current week). */
export const ROLLING_CONSISTENCY_LOOKBACK_WEEKS = 6;

/** Max extra lift on Foundation pillar mass from rolling rhythm (multiplier = 1 + cap × score). */
export const FOUNDATION_STREAK_BONUS_CAP = 0.06;

/** Max extra lift on Formation pillar mass (primary discipleship rhythm reward). */
export const FORMATION_STREAK_BONUS_CAP = 0.15;

/** Reserved; reproduction rhythm not scored in v1 — multiplier stays 1. */
export const REPRODUCTION_STREAK_BONUS_CAP = 0.03;

export type WeeklyRhythmStatus = "complete" | "partial" | "empty";

export type FoundationWeekRhythmRow = {
  weekKey: string;
  status: WeeklyRhythmStatus;
  score: number;
};

export type FormationWeekRhythmRow = {
  weekKey: string;
  status: WeeklyRhythmStatus;
  score: number;
};

export type ReproductionWeekRhythmRow = {
  weekKey: string;
  status: WeeklyRhythmStatus;
  score: number;
};

export type RollingRhythmMultipliers = {
  foundation: number;
  formation: number;
  reproduction: number;
};

export type RollingRhythmContext = {
  rollingConsistencyLookbackWeeks: typeof ROLLING_CONSISTENCY_LOOKBACK_WEEKS;
  rollingFoundationScore: number;
  rollingFormationScore: number;
  rollingReproductionScore: number;
  foundationConsistencyMultiplier: number;
  formationConsistencyMultiplier: number;
  reproductionConsistencyMultiplier: number;
  foundationWeeklyRhythm: FoundationWeekRhythmRow[];
  formationWeeklyRhythm: FormationWeekRhythmRow[];
  /** v1: always empty scores (reproduction pillar not boosted by this layer). */
  reproductionWeeklyRhythm: ReproductionWeekRhythmRow[];
  /** Why formation may only use complete/empty in edge cases. */
  formationRhythmModelNote: string;
};

function weekKeysOldestFirst(timeZone: string, now: Date, count: number): string[] {
  const currentSunday = pillarWeekStartKeyFromInstant(now, timeZone);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const sun = ymdAddCalendarDays(currentSunday, -7 * i);
    keys.push(`week:${sun}`);
  }
  return keys;
}

function signalsForWeek(
  normalized: readonly NormalizedSignal[],
  weekKey: string
): NormalizedSignal[] {
  return normalized.filter((s) => s.windowKey === weekKey);
}

function soapsForWeek(signals: NormalizedSignal[]): NormalizedSignal | undefined {
  return signals.find((s) => s.practiceType === "soaps");
}

function prayerForWeek(signals: NormalizedSignal[]): NormalizedSignal | undefined {
  return signals.find((s) => s.practiceType === "prayer");
}

function memoryForWeek(signals: NormalizedSignal[], subtype: "memory_new" | "memory_review") {
  return signals.find((s) => s.practiceType === "memory" && s.subtype === subtype);
}

function memoryDistinctPracticeDays(signals: NormalizedSignal[]): number {
  const days = new Set<string>();
  for (const s of signals) {
    if (s.practiceType !== "memory") continue;
    const m = s.metadata as Record<string, unknown> | undefined;
    const arr =
      s.subtype === "memory_new"
        ? m?.practiceDaysNew
        : s.subtype === "memory_review"
          ? m?.practiceDaysReview
          : undefined;
    if (Array.isArray(arr)) {
      for (const d of arr) {
        if (typeof d === "string") days.add(d.slice(0, 10));
      }
    }
  }
  return days.size;
}

function metaNum(m: Record<string, unknown> | undefined, key: string): number {
  const v = m?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Foundation family week: SOAPS + prayer + scripture (new/review) in one pillar week.
 * Partial = any 2 of 3 “meaningful” legs without full complete (see inline thresholds).
 */
export function foundationWeekRhythm(
  signals: NormalizedSignal[],
  prayerWeeklyGoalMinutes: number
): { status: WeeklyRhythmStatus; score: number } {
  const soaps = soapsForWeek(signals);
  const prayer = prayerForWeek(signals);
  const mNew = memoryForWeek(signals, "memory_new");
  const mRev = memoryForWeek(signals, "memory_review");

  const soapsComplete =
    !!soaps && (soaps.qualifyingUnits >= 4 || soaps.daysWithActivity >= 4);
  const soapsMeaningful =
    !!soaps && (soaps.qualifyingUnits >= 1 || soaps.daysWithActivity >= 1);

  const prayerComplete =
    !!prayer &&
    (prayer.daysWithActivity >= 4 ||
      (prayerWeeklyGoalMinutes > 0 && prayer.totalUnits >= prayerWeeklyGoalMinutes * 0.5));
  const prayerMeaningful =
    !!prayer && (prayer.totalUnits > 0 || prayer.daysWithActivity >= 1);

  const memDays = memoryDistinctPracticeDays(signals);
  const memUnits = (mNew?.totalUnits ?? 0) + (mRev?.totalUnits ?? 0);
  const memoryComplete = memDays >= 3;
  const memoryMeaningful = memDays >= 1 || memUnits > 0;

  const complete = soapsComplete && prayerComplete && memoryComplete;
  if (complete) return { status: "complete", score: 1 };

  const meaningfulCount =
    (soapsMeaningful ? 1 : 0) + (prayerMeaningful ? 1 : 0) + (memoryMeaningful ? 1 : 0);
  if (meaningfulCount >= 2) return { status: "partial", score: 0.5 };

  return { status: "empty", score: 0 };
}

/**
 * Formation family: CHAT + 3/3rds. Complete = strong weekly anchor for either practice.
 * Partial = CHAT check-ins exist but no “kept up” qualifying units that week (showed up, rhythm weak).
 * Empty = neither communal anchor present.
 */
export function formationWeekRhythm(signals: NormalizedSignal[]): {
  status: WeeklyRhythmStatus;
  score: number;
} {
  const chat = signals.find((s) => s.practiceType === "chat");
  const thirds = signals.find((s) => s.practiceType === "thirds");

  const chatStrong = !!chat && chat.totalUnits > 0;
  const thirdsStrong = !!thirds && thirds.totalUnits > 0;
  if (chatStrong || thirdsStrong) return { status: "complete", score: 1 };

  const meta = chat?.metadata as Record<string, unknown> | undefined;
  const checkIns = metaNum(meta, "checkInCount");
  const keptUp = metaNum(meta, "keptUpCount");
  if (chat && checkIns > 0 && keptUp === 0) {
    return { status: "partial", score: 0.5 };
  }

  return { status: "empty", score: 0 };
}

function rollingAverage(rows: { score: number }[]): number {
  const n = ROLLING_CONSISTENCY_LOOKBACK_WEEKS;
  const sum = rows.reduce((a, r) => a + r.score, 0);
  return sum / n;
}

function multiplierFromScore(score: number, cap: number): number {
  return 1 + cap * score;
}

/**
 * Builds trailing-week rhythm rows and capped pillar multipliers. Safe with sparse history: missing
 * weeks count as empty (score 0) in the fixed /6 average — no explosion for new users.
 */
export function computeRollingRhythmContext(
  normalized: readonly NormalizedSignal[],
  goals: GoalAlignmentInputGoals,
  timeZone: string,
  now: Date
): RollingRhythmContext {
  const weekKeys = weekKeysOldestFirst(timeZone, now, ROLLING_CONSISTENCY_LOOKBACK_WEEKS);

  const foundationWeeklyRhythm: FoundationWeekRhythmRow[] = [];
  const formationWeeklyRhythm: FormationWeekRhythmRow[] = [];
  const reproductionWeeklyRhythm: ReproductionWeekRhythmRow[] = [];

  for (const wk of weekKeys) {
    const slice = signalsForWeek(normalized, wk);
    const f = foundationWeekRhythm(slice, goals.prayerWeeklyMinutesGoal);
    foundationWeeklyRhythm.push({ weekKey: wk, status: f.status, score: f.score });
    const fo = formationWeekRhythm(slice);
    formationWeeklyRhythm.push({ weekKey: wk, status: fo.status, score: fo.score });
    reproductionWeeklyRhythm.push({ weekKey: wk, status: "empty", score: 0 });
  }

  const rollingFoundationScore = rollingAverage(foundationWeeklyRhythm);
  const rollingFormationScore = rollingAverage(formationWeeklyRhythm);
  const rollingReproductionScore = 0;

  const foundationConsistencyMultiplier = multiplierFromScore(
    rollingFoundationScore,
    FOUNDATION_STREAK_BONUS_CAP
  );
  const formationConsistencyMultiplier = multiplierFromScore(
    rollingFormationScore,
    FORMATION_STREAK_BONUS_CAP
  );
  const reproductionConsistencyMultiplier = 1;

  return {
    rollingConsistencyLookbackWeeks: ROLLING_CONSISTENCY_LOOKBACK_WEEKS,
    rollingFoundationScore,
    rollingFormationScore,
    rollingReproductionScore,
    foundationConsistencyMultiplier,
    formationConsistencyMultiplier,
    reproductionConsistencyMultiplier,
    foundationWeeklyRhythm,
    formationWeeklyRhythm,
    reproductionWeeklyRhythm,
    formationRhythmModelNote:
      "Formation weeks: complete = CHAT or 3/3rds weekly anchor present; partial = CHAT check-ins without kept-up signal. v1 does not score reproduction in this layer.",
  };
}
