import type {
  CategoryId,
  CategoryScore,
  ModifiedSignal,
} from "@/lib/metrics/formation-momentum/types";
import {
  DEFAULT_CONTRIBUTION_MATRIX,
  type ContributionMatrix,
} from "@/lib/metrics/formation-momentum/matrix";

const CATEGORY_ORDER: CategoryId[] = ["foundation", "formation", "reproduction"];

export type PerSignalCategoryMass = {
  signalId: string;
  foundation: number;
  formation: number;
  reproduction: number;
};

type MatrixAggregateResult = {
  totals: Record<CategoryId, number>;
  /** Per-signal mass into each category (same math as summing `totals`). */
  perSignal: PerSignalCategoryMass[];
};

export type MatrixAggregateWithShareOverrideResult = MatrixAggregateResult & {
  /** Share-only category mass before weakness drag (for inspection). */
  shareOnlyTotals: Record<CategoryId, number>;
};

function aggregateContributionMatrix(
  signals: readonly ModifiedSignal[],
  matrix: ContributionMatrix
): MatrixAggregateResult {
  const totals: Record<CategoryId, number> = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  const perSignal: MatrixAggregateResult["perSignal"] = [];

  for (const s of signals) {
    const row = matrix[s.practiceType];
    if (!row) {
      perSignal.push({
        signalId: s.id,
        foundation: 0,
        formation: 0,
        reproduction: 0,
      });
      continue;
    }
    const w = s.effectiveWeight;
    const foundation = w * row.foundation;
    const formation = w * row.formation;
    const reproduction = w * row.reproduction;
    totals.foundation += foundation;
    totals.formation += formation;
    totals.reproduction += reproduction;
    perSignal.push({
      signalId: s.id,
      foundation,
      formation,
      reproduction,
    });
  }

  return { totals, perSignal };
}

/**
 * Like {@link aggregateContributionMatrix}, but uses `shareRow` for `practiceType === "share"` only.
 * Non-share rows still come from `matrix`. Used by the progressive sharing-impact layer.
 */
export function applyMatrixWithShareRowOverride(
  signals: readonly ModifiedSignal[],
  matrix: ContributionMatrix,
  shareRow: Record<CategoryId, number>
): MatrixAggregateWithShareOverrideResult {
  const totals: Record<CategoryId, number> = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  const shareOnlyTotals: Record<CategoryId, number> = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  const perSignal: PerSignalCategoryMass[] = [];

  for (const s of signals) {
    const row = s.practiceType === "share" ? shareRow : matrix[s.practiceType];
    if (!row) {
      perSignal.push({
        signalId: s.id,
        foundation: 0,
        formation: 0,
        reproduction: 0,
      });
      continue;
    }
    const w = s.effectiveWeight;
    const foundation = w * row.foundation;
    const formation = w * row.formation;
    const reproduction = w * row.reproduction;
    totals.foundation += foundation;
    totals.formation += formation;
    totals.reproduction += reproduction;
    if (s.practiceType === "share") {
      shareOnlyTotals.foundation += foundation;
      shareOnlyTotals.formation += formation;
      shareOnlyTotals.reproduction += reproduction;
    }
    perSignal.push({
      signalId: s.id,
      foundation,
      formation,
      reproduction,
    });
  }

  return { totals, perSignal, shareOnlyTotals };
}

/**
 * Bounded weakness drag: rescale **share-derived** per-signal masses only, then re-sum totals.
 */
export function applyShareDragToPerSignalAndTotals(
  perSignal: readonly PerSignalCategoryMass[],
  modified: readonly ModifiedSignal[],
  drag: Record<CategoryId, number>
): MatrixAggregateResult {
  const shareIds = new Set(
    modified.filter((s) => s.practiceType === "share").map((s) => s.id)
  );
  const scaled: PerSignalCategoryMass[] = perSignal.map((p) => {
    if (!shareIds.has(p.signalId)) {
      return { ...p };
    }
    return {
      signalId: p.signalId,
      foundation: p.foundation * drag.foundation,
      formation: p.formation * drag.formation,
      reproduction: p.reproduction * drag.reproduction,
    };
  });
  const totals: Record<CategoryId, number> = {
    foundation: 0,
    formation: 0,
    reproduction: 0,
  };
  for (const p of scaled) {
    totals.foundation += p.foundation;
    totals.formation += p.formation;
    totals.reproduction += p.reproduction;
  }
  return { totals, perSignal: scaled };
}

/**
 * Distribute modified effective weights into category dimensions using the contribution matrix.
 */
export function applyMatrix(
  signals: readonly ModifiedSignal[],
  matrix: ContributionMatrix = DEFAULT_CONTRIBUTION_MATRIX
): Record<CategoryId, number> {
  return aggregateContributionMatrix(signals, matrix).totals;
}

/**
 * Same weighting as {@link applyMatrix}, plus per-signal category masses for tuning / inspection.
 */
export function applyMatrixWithPerSignalContributions(
  signals: readonly ModifiedSignal[],
  matrix: ContributionMatrix = DEFAULT_CONTRIBUTION_MATRIX
): MatrixAggregateResult {
  return aggregateContributionMatrix(signals, matrix);
}

/**
 * Turn aggregated category masses into display scores (e.g. softmax / cap — TBD).
 */
export function computeCategoryScores(aggregates: Record<CategoryId, number>): CategoryScore[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    score: aggregates[category] ?? 0,
  }));
}
