import type { PerSignalCategoryMass } from "@/lib/metrics/formation-momentum/aggregator";
import type { CategoryContributionBreakdown, CategoryId } from "@/lib/metrics/formation-momentum/types";

/**
 * **Progression gate** — post–stage-matrix / post–sharing-drag, pre–final snapshot.
 *
 * Aligns unlock **shares** with staged category totals **after** stage matrix, sharing overlay/drag, and
 * **rolling rhythm** multipliers on pillar masses (same units as `preGateTotals` here). Stage detection still
 * uses provisional baseline totals elsewhere — do not confuse the two.
 *
 * **Foundation** is never scaled. **Formation** ramps with Foundation share. **Reproduction** uses the
 * minimum of a Foundation ramp and a Formation ramp so it trails both (overflow, not independence).
 */

/** Foundation share of (F+Fo+R) at/above this ⇒ Formation at full strength (`formationMultiplier === 1`). */
export const FOUNDATION_PROGRESS_UNLOCK_THRESHOLD = 0.4;

/** Floor for Formation multiplier when Foundation share is 0 (smooth emergence, not a dead cliff). */
export const FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK = 0.1;

/** Formation share of totals at/above this ⇒ Formation leg of Reproduction gate fully open. */
export const FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD = 0.3;

/** Floor for Reproduction from Formation ramp when Formation share is 0. */
export const REPRODUCTION_MIN_MULTIPLIER_BEFORE_FORMATION_UNLOCK = 0.15;

/** Floor for Reproduction from Foundation ramp when Foundation share is 0. */
export const REPRODUCTION_MIN_MULTIPLIER_BEFORE_FOUNDATION_UNLOCK = 0.35;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Share of one category in F+Fo+R; 0 if sum is non-positive. */
export function categoryShareOfTotal(
  totals: Record<CategoryId, number>,
  category: CategoryId
): number {
  const sum = totals.foundation + totals.formation + totals.reproduction;
  if (!(sum > 0)) return 0;
  return totals[category] / sum;
}

/**
 * Foundation progress for unlock: **Foundation ÷ sum(staged categories)** using totals **immediately before**
 * this gate (stage matrix + sharing row + share drag already applied).
 */
export function computeFoundationProgressForUnlock(preGateTotals: Record<CategoryId, number>): number {
  return categoryShareOfTotal(preGateTotals, "foundation");
}

function formationMultiplierFromFoundationShare(foundationShare: number): number {
  if (foundationShare >= FOUNDATION_PROGRESS_UNLOCK_THRESHOLD) return 1;
  const ratio = clamp01(foundationShare / FOUNDATION_PROGRESS_UNLOCK_THRESHOLD);
  return (
    FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK +
    (1 - FORMATION_MIN_MULTIPLIER_BEFORE_UNLOCK) * ratio
  );
}

function reproductionFoundationMultiplierFromFoundationShare(foundationShare: number): number {
  if (foundationShare >= FOUNDATION_PROGRESS_UNLOCK_THRESHOLD) return 1;
  const ratio = clamp01(foundationShare / FOUNDATION_PROGRESS_UNLOCK_THRESHOLD);
  return (
    REPRODUCTION_MIN_MULTIPLIER_BEFORE_FOUNDATION_UNLOCK +
    (1 - REPRODUCTION_MIN_MULTIPLIER_BEFORE_FOUNDATION_UNLOCK) * ratio
  );
}

function reproductionFormationMultiplierFromFormationShare(formationShare: number): number {
  if (formationShare >= FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD) return 1;
  const ratio = clamp01(formationShare / FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD);
  return (
    REPRODUCTION_MIN_MULTIPLIER_BEFORE_FORMATION_UNLOCK +
    (1 - REPRODUCTION_MIN_MULTIPLIER_BEFORE_FORMATION_UNLOCK) * ratio
  );
}

export type ProgressionCategoryGateResult = {
  totals: Record<CategoryId, number>;
  perSignal: PerSignalCategoryMass[];
  preGateTotals: CategoryContributionBreakdown;
  postGateTotals: CategoryContributionBreakdown;
  foundationProgressForUnlock: number;
  formationProgressForReproductionUnlock: number;
  formationMultiplier: number;
  reproductionFoundationMultiplier: number;
  reproductionFormationMultiplier: number;
  reproductionMultiplier: number;
  foundationUnlockReached: boolean;
  formationReproductionUnlockReached: boolean;
  /**
   * True when Foundation share is still below {@link FOUNDATION_PROGRESS_UNLOCK_THRESHOLD} (legacy name for UI).
   * Not “Formation dead” — {@link formationMultiplier} is a ramp, not a cliff.
   */
  formationGated: boolean;
  unlockThreshold: number;
  formationReproductionUnlockThreshold: number;
};

/**
 * Scales **only** Formation and Reproduction masses using **pre-gate staged** totals for progress ratios.
 *
 * @param preGateTotals — `runStageBasedAggregation` totals after matrix + share override + share drag.
 * @param perSignal — matching per-signal masses (same pipeline point).
 */
export function applyProgressionCategoryGate(
  preGateTotals: Record<CategoryId, number>,
  perSignal: readonly PerSignalCategoryMass[]
): ProgressionCategoryGateResult {
  const foundationProgressForUnlock = computeFoundationProgressForUnlock(preGateTotals);
  const formationProgressForReproductionUnlock = categoryShareOfTotal(preGateTotals, "formation");

  const foundationUnlockReached = foundationProgressForUnlock >= FOUNDATION_PROGRESS_UNLOCK_THRESHOLD;
  const formationReproductionUnlockReached =
    formationProgressForReproductionUnlock >= FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD;

  const formationMultiplier = formationMultiplierFromFoundationShare(foundationProgressForUnlock);
  const reproductionFoundationMultiplier =
    reproductionFoundationMultiplierFromFoundationShare(foundationProgressForUnlock);
  const reproductionFormationMultiplier =
    reproductionFormationMultiplierFromFormationShare(formationProgressForReproductionUnlock);
  const reproductionMultiplier = Math.min(
    reproductionFoundationMultiplier,
    reproductionFormationMultiplier
  );

  const preGateTotalsSnapshot: CategoryContributionBreakdown = {
    foundation: preGateTotals.foundation,
    formation: preGateTotals.formation,
    reproduction: preGateTotals.reproduction,
  };

  const scaleLine = (p: PerSignalCategoryMass): PerSignalCategoryMass => ({
    signalId: p.signalId,
    foundation: p.foundation,
    formation: p.formation * formationMultiplier,
    reproduction: p.reproduction * reproductionMultiplier,
  });

  const scaledPer = perSignal.map(scaleLine);
  const postGateTotals: CategoryContributionBreakdown = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  for (const p of scaledPer) {
    postGateTotals.foundation += p.foundation;
    postGateTotals.formation += p.formation;
    postGateTotals.reproduction += p.reproduction;
  }

  return {
    totals: postGateTotals,
    perSignal: scaledPer,
    preGateTotals: preGateTotalsSnapshot,
    postGateTotals,
    foundationProgressForUnlock,
    formationProgressForReproductionUnlock,
    formationMultiplier,
    reproductionFoundationMultiplier,
    reproductionFormationMultiplier,
    reproductionMultiplier,
    foundationUnlockReached,
    formationReproductionUnlockReached,
    formationGated: !foundationUnlockReached,
    unlockThreshold: FOUNDATION_PROGRESS_UNLOCK_THRESHOLD,
    formationReproductionUnlockThreshold: FORMATION_PROGRESS_REPRODUCTION_UNLOCK_THRESHOLD,
  };
}
