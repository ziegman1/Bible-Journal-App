import type {
  CategoryContributionBreakdown,
  GrowthStageId,
} from "@/lib/metrics/formation-momentum/types";

/**
 * **Growth stage (v1)** — maps rough “discipleship maturity” from **provisional** category masses
 * (computed with the fixed baseline matrix) so we can pick a **stage-specific** contribution matrix
 * without touching recency, consistency, goal alignment, or grace.
 *
 * **Why stages:** Early on, daily habits should emphasize **Foundation**; as outward/reproducing
 * activity rises, the same signals should shift weight toward **Formation** and **Reproduction**.
 * Stage is re-evaluated each engine run from current effective weights + baseline split.
 */

export const GROWTH_STAGE_LABEL: Record<GrowthStageId, string> = {
  1: "Building Foundation",
  2: "Developing Formation",
  3: "Reproducing",
};

export type GrowthStageDetection = {
  stage: GrowthStageId;
  label: string;
  shares: {
    foundation: number;
    formation: number;
    reproduction: number;
  };
};

/**
 * Uses **provisional** foundation / formation / reproduction totals (same modifier chain, baseline matrix).
 * Simple, explainable thresholds on **share of total mass** — tune after field testing.
 */
export function detectGrowthStage(
  provisional: CategoryContributionBreakdown
): GrowthStageDetection {
  const t = provisional.foundation + provisional.formation + provisional.reproduction;
  if (t <= 0) {
    return {
      stage: 1,
      label: GROWTH_STAGE_LABEL[1],
      shares: { foundation: 1 / 3, formation: 1 / 3, reproduction: 1 / 3 },
    };
  }

  const f = provisional.foundation / t;
  const fo = provisional.formation / t;
  const r = provisional.reproduction / t;

  // Stage 3: outward/reproducing momentum — reproduction share meaningful, formation not collapsed
  if (r >= 0.32 || (r >= 0.26 && fo >= 0.3)) {
    return { stage: 3, label: GROWTH_STAGE_LABEL[3], shares: { foundation: f, formation: fo, reproduction: r } };
  }

  // Stage 1: still foundation-heavy, little reproduction signal
  if (f >= 0.44 && r <= 0.19) {
    return { stage: 1, label: GROWTH_STAGE_LABEL[1], shares: { foundation: f, formation: fo, reproduction: r } };
  }

  // Stage 2: middle — developing formation / community rhythm
  return { stage: 2, label: GROWTH_STAGE_LABEL[2], shares: { foundation: f, formation: fo, reproduction: r } };
}
