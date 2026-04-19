/**
 * Progressive sharing-impact model (v1).
 *
 * Why Sharing is treated uniquely:
 * Reproducibility depends on faithful witness over time. A single “share” log is not the same
 * as sustained, obedient sharing. This module does not change how other practices are scored;
 * it only replaces the **share** row of the stage matrix with a level-specific profile and
 * optionally applies a **bounded** weakness drag to share-derived mass so low/absent sharing
 * constrains reproduction (and formation) without collapsing foundation from other practices.
 *
 * How consistency is determined (v1):
 * - Trailing window of pillar weeks (Sunday-anchored keys, same as the rest of the engine).
 * - Count distinct pillar weeks in that window where the user logged share activity (totalUnits > 0).
 * - Map that count to levels 1–4 (occasional → sustained). Tunable thresholds below.
 *
 * How lift and drag are bounded:
 * - Positive profiles are normalized rows (sum to 1) per level — no runaway amplification.
 * - Weakness drag only rescales **share-derived** category mass by multipliers in [dragFloor, 1];
 *   non-share contributions are untouched, so totals cannot collapse to zero from drag alone.
 */

import type { CategoryId, NormalizedSignal } from "./types";
import {
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";

/** Tunable: number of recent pillar weeks to evaluate (recommend 6–8). */
export const SHARING_TRAILING_PILLAR_WEEKS = 8;

/** Level keys for explain / tuning. */
export const SHARING_LEVEL_KEYS = {
  1: "occasional",
  2: "emerging",
  3: "consistent",
  4: "sustained",
} as const;

export type SharingLevelId = 1 | 2 | 3 | 4;

export type SharingProfileRow = Record<CategoryId, number>;

/**
 * Per-level share row: early faithfulness emphasizes foundation; sustained faithfulness
 * shifts mass toward reproduction. Rows sum to 1.
 */
export const SHARING_PROFILE_ROWS: Record<SharingLevelId, SharingProfileRow> = {
  1: { foundation: 0.48, formation: 0.32, reproduction: 0.2 },
  2: { foundation: 0.32, formation: 0.38, reproduction: 0.3 },
  3: { foundation: 0.22, formation: 0.35, reproduction: 0.43 },
  4: { foundation: 0.14, formation: 0.28, reproduction: 0.58 },
};

export const SHARING_PROFILE_IDS: Record<SharingLevelId, string> = {
  1: "sharing_profile_occasional_v1",
  2: "sharing_profile_emerging_v1",
  3: "sharing_profile_consistent_v1",
  4: "sharing_profile_sustained_v1",
};

/**
 * Weakness drag multipliers applied only to share-derived category mass.
 * Level 3–4: no drag. Level 1–2: strongest on reproduction, lighter on formation, lightest on foundation.
 */
export const SHARING_DRAG_MULTIPLIERS: Record<
  SharingLevelId,
  Record<CategoryId, number>
> = {
  1: { foundation: 0.96, formation: 0.88, reproduction: 0.78 },
  2: { foundation: 0.99, formation: 0.94, reproduction: 0.9 },
  3: { foundation: 1, formation: 1, reproduction: 1 },
  4: { foundation: 1, formation: 1, reproduction: 1 },
};

export type SharingImpactModel = {
  windowPillarWeeks: number;
  weeksWithShareActivity: number;
  level: SharingLevelId;
  levelKey: (typeof SHARING_LEVEL_KEYS)[SharingLevelId];
  levelLabel: string;
  profileId: string;
  profileRow: SharingProfileRow;
  dragMultipliers: Record<CategoryId, number>;
  /** True when any drag multiplier is < 1 (levels 1–2). */
  dragApplied: boolean;
};

const LEVEL_LABELS: Record<SharingLevelId, string> = {
  1: "Occasional",
  2: "Emerging",
  3: "Consistent",
  4: "Sustained",
};

/**
 * Map weeks-with-activity count → level (v1 thresholds, tunable).
 * 0–2 → occasional, 3–4 → emerging, 5–6 → consistent, 7–8 → sustained (for 8-week window).
 */
export function sharingWeeksCountToLevel(
  weeksWithActivity: number,
  windowWeeks: number
): SharingLevelId {
  const w = Math.max(0, Math.min(weeksWithActivity, windowWeeks));
  if (w <= 2) return 1;
  if (w <= 4) return 2;
  if (w <= 6) return 3;
  return 4;
}

/**
 * Build the set of pillar week keys `week:${sundayYmd}` for the trailing window ending at `now`.
 */
export function pillarWeekKeysForTrailingWindow(
  timeZone: string,
  now: Date,
  trailingWeeks: number
): Set<string> {
  const currentSunday = pillarWeekStartKeyFromInstant(now, timeZone);
  const keys = new Set<string>();
  for (let i = 0; i < trailingWeeks; i++) {
    const sundayYmd = ymdAddCalendarDays(currentSunday, -7 * i);
    keys.add(`week:${sundayYmd}`);
  }
  return keys;
}

/**
 * Count pillar weeks in the window that have at least one share signal with totalUnits > 0.
 */
export function countWeeksWithShareActivity(
  normalized: readonly NormalizedSignal[],
  timeZone: string,
  now: Date,
  trailingWeeks: number = SHARING_TRAILING_PILLAR_WEEKS
): number {
  const allowed = pillarWeekKeysForTrailingWindow(timeZone, now, trailingWeeks);
  const weeksHit = new Set<string>();
  for (const s of normalized) {
    if (s.practiceType !== "share") continue;
    if (s.totalUnits <= 0) continue;
    if (!allowed.has(s.windowKey)) continue;
    weeksHit.add(s.windowKey);
  }
  return weeksHit.size;
}

export function evaluateSharingImpactModel(
  normalized: readonly NormalizedSignal[],
  timeZone: string,
  now: Date,
  trailingWeeks: number = SHARING_TRAILING_PILLAR_WEEKS
): SharingImpactModel {
  const weeksWithShareActivity = countWeeksWithShareActivity(
    normalized,
    timeZone,
    now,
    trailingWeeks
  );
  const level = sharingWeeksCountToLevel(weeksWithShareActivity, trailingWeeks);
  const profileRow = SHARING_PROFILE_ROWS[level];
  const dragMultipliers = SHARING_DRAG_MULTIPLIERS[level];
  const dragApplied =
    dragMultipliers.foundation < 1 ||
    dragMultipliers.formation < 1 ||
    dragMultipliers.reproduction < 1;

  return {
    windowPillarWeeks: trailingWeeks,
    weeksWithShareActivity,
    level,
    levelKey: SHARING_LEVEL_KEYS[level],
    levelLabel: LEVEL_LABELS[level],
    profileId: SHARING_PROFILE_IDS[level],
    profileRow: { ...profileRow },
    dragMultipliers: { ...dragMultipliers },
    dragApplied,
  };
}
