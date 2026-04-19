/**
 * Phase-based **presentation** for Formation Momentum gauges (Foundation / Formation / Reproduction).
 *
 * This layer maps the same benchmark-derived progress used by `benchmarks.ts` into three **named phases**
 * per category. It does **not** change scoring or raw masses — gauges visualize growth phases and
 * approximate position for encouragement, not engine math.
 *
 * Mapping v1: the five benchmark bands (`scoreToBenchmarkProgress`) are grouped into three phases:
 * - bands 0–1 → phase 1
 * - band 2 → phase 2
 * - bands 3–4 → phase 3
 *
 * Needle position (`needleT` 0…1) spans the full semicircle; within-phase progress is interpolated from
 * the existing within-band ratio so the needle moves smoothly without exposing raw scores.
 */

import { scoreToBenchmarkProgress, type BenchmarkProgress } from "@/lib/metrics/formation-momentum/benchmarks";
import type { CategoryId } from "@/lib/metrics/formation-momentum/types";

/** Category-specific labels for the three major phase zones (fixed order: early → middle → late). */
export const CATEGORY_PHASE_LABELS: Record<
  CategoryId,
  readonly [string, string, string]
> = {
  foundation: ["Laying", "Rooting", "Deepening"],
  formation: ["Learning", "Practicing", "Becoming"],
  reproduction: ["Emerging", "Engaging", "Multiplying"],
};

export type PhaseGaugePresentation = {
  /** Index of the current phase (0 = first column of labels). */
  phaseIndex: 0 | 1 | 2;
  /** Human-readable phase name for this category. */
  phaseLabel: string;
  /** All three phase names for this category (arc zone labels). */
  phaseLabels: readonly [string, string, string];
  /**
   * Needle position along the full semicircle, 0 = start (first phase end) … 1 = end (last phase).
   * Derived from benchmark band index + within-band progress.
   */
  needleT: number;
  /** Approximate position within the current phase segment, 0…1 (for subtle copy). */
  withinPhase: number;
  /** Short encouraging line — no raw numbers. */
  positionSubtitle: string;
  /** Retained for debugging / future copy; not shown as primary UI in v1. */
  benchmark: Pick<BenchmarkProgress, "levelName" | "levelIndex">;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Map benchmark band (0–4) + within-band progress to a phase index and position within that phase.
 */
function bandProgressToPhase(
  levelIndex: number,
  progressToNext: number
): { phaseIndex: 0 | 1 | 2; withinPhase: number } {
  const p = clamp01(progressToNext);

  if (levelIndex <= 1) {
    const phaseIndex = 0 as const;
    const withinPhase = levelIndex === 0 ? p / 2 : 0.5 + p / 2;
    return { phaseIndex, withinPhase };
  }
  if (levelIndex === 2) {
    return { phaseIndex: 1, withinPhase: p };
  }
  const phaseIndex = 2 as const;
  const withinPhase = levelIndex === 3 ? p / 2 : 0.5 + p / 2;
  return { phaseIndex, withinPhase };
}

function qualitativeSubtitle(withinPhase: number): string {
  if (withinPhase < 0.34) return "Early in this phase";
  if (withinPhase < 0.67) return "Growing through this phase";
  return "Well along in this phase";
}

/**
 * Full presentation for a category gauge from raw category score (same units as benchmarks).
 */
export function scoreToPhaseGauge(category: CategoryId, score: number): PhaseGaugePresentation {
  const b = scoreToBenchmarkProgress(score);
  const { phaseIndex, withinPhase } = bandProgressToPhase(b.levelIndex, b.progressToNext);
  const phaseLabels = CATEGORY_PHASE_LABELS[category];
  const needleT = clamp01((phaseIndex + withinPhase) / 3);

  return {
    phaseIndex,
    phaseLabel: phaseLabels[phaseIndex]!,
    phaseLabels,
    needleT,
    withinPhase,
    positionSubtitle: qualitativeSubtitle(withinPhase),
    benchmark: { levelName: b.levelName, levelIndex: b.levelIndex },
  };
}
