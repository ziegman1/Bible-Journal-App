import type { PerSignalCategoryMass } from "@/lib/metrics/formation-momentum/aggregator";
import type { CategoryId } from "@/lib/metrics/formation-momentum/types";

/**
 * Progressive discipleship ordering (v1): **Foundation** is established first; **Formation** meaningfully
 * accumulates only after Foundation represents a sufficient share of baseline category mass. **Reproduction**
 * stays comparatively light early. Formation is intentionally unlocked only after Foundation begins taking root
 * in the provisional (baseline-matrix) balance — not a rewrite of modifiers, stage detection, or sharing.
 */

/** Foundation must reach this share of provisional (baseline) category mass before Formation scores at full strength. */
export const FOUNDATION_PROGRESS_UNLOCK_THRESHOLD = 0.4;

/**
 * When gated, Formation contributions are scaled toward zero so Foundation can lead early.
 * Kept aggressive so weekly anchors (CHAT / 3/3rds) do not outrank dailies on day one.
 */
export const FORMATION_GATED_MULTIPLIER = 0.05;

/**
 * Optional light dampening for Reproduction until Foundation is established (share-derived mass can still spike).
 */
export const REPRODUCTION_GATED_MULTIPLIER = 0.55;

export type ProgressionCategoryGateResult = {
  totals: Record<CategoryId, number>;
  perSignal: PerSignalCategoryMass[];
  /** Foundation’s share of provisional category mass (baseline matrix) — v1 “progress toward unlock”. */
  foundationProgressForUnlock: number;
  formationGated: boolean;
  formationGatingMultiplier: number;
  reproductionGatingMultiplier: number;
  unlockThreshold: number;
};

/**
 * v1 unlock metric: ratio of **Foundation** to total provisional mass (`DEFAULT_CONTRIBUTION_MATRIX`),
 * i.e. how much of the baseline discipleship split is Foundation-weighted before stage matrices and sharing layers.
 */
export function computeFoundationProgressForUnlock(
  provisionalTotals: Record<CategoryId, number>
): number {
  const sum =
    provisionalTotals.foundation + provisionalTotals.formation + provisionalTotals.reproduction;
  if (!(sum > 0)) return 0;
  return provisionalTotals.foundation / sum;
}

/**
 * Layered after stage matrix + sharing: scales **Formation** (and lightly **Reproduction**) category masses
 * when Foundation progress is below the unlock threshold. Does not alter recency, consistency, goal alignment,
 * grace, stage detection inputs, or sharing model logic — only post-aggregation category weights.
 */
export function applyProgressionCategoryGate(
  totals: Record<CategoryId, number>,
  perSignal: readonly PerSignalCategoryMass[],
  provisionalTotals: Record<CategoryId, number>
): ProgressionCategoryGateResult {
  const foundationProgressForUnlock = computeFoundationProgressForUnlock(provisionalTotals);
  const below = foundationProgressForUnlock < FOUNDATION_PROGRESS_UNLOCK_THRESHOLD;
  const formationGatingMultiplier = below ? FORMATION_GATED_MULTIPLIER : 1;
  const reproductionGatingMultiplier = below ? REPRODUCTION_GATED_MULTIPLIER : 1;

  const scaleLine = (p: PerSignalCategoryMass): PerSignalCategoryMass => ({
    signalId: p.signalId,
    foundation: p.foundation,
    formation: p.formation * formationGatingMultiplier,
    reproduction: p.reproduction * reproductionGatingMultiplier,
  });

  const scaledPer = perSignal.map(scaleLine);
  const outTotals: Record<CategoryId, number> = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  for (const p of scaledPer) {
    outTotals.foundation += p.foundation;
    outTotals.formation += p.formation;
    outTotals.reproduction += p.reproduction;
  }

  return {
    totals: outTotals,
    perSignal: scaledPer,
    foundationProgressForUnlock,
    formationGated: below,
    formationGatingMultiplier,
    reproductionGatingMultiplier,
    unlockThreshold: FOUNDATION_PROGRESS_UNLOCK_THRESHOLD,
  };
}
