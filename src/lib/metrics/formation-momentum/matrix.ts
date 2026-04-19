import type { CategoryId, GrowthStageId, PracticeType } from "@/lib/metrics/formation-momentum/types";

/**
 * Contribution weights: each practice splits influence across Foundation, Formation, Reproduction.
 * Rows sum to 1 per practice.
 *
 * **Stage-based weighting:** `DEFAULT_CONTRIBUTION_MATRIX` is the **baseline** used only to compute
 * provisional category totals for **growth-stage detection**. The engine then applies
 * `STAGE_CONTRIBUTION_MATRICES[stage]` for final aggregation so impact **evolves** as provisional
 * balance shifts — modeling progressive discipleship without changing modifiers.
 */

export type ContributionMatrix = Record<
  PracticeType,
  Record<CategoryId, number>
>;

/** Baseline matrix (same as historical v1 default). Used for provisional totals → stage detection. Stage 2 final uses this matrix. */
export const DEFAULT_CONTRIBUTION_MATRIX: ContributionMatrix = {
  soaps: { foundation: 0.5, formation: 0.35, reproduction: 0.15 },
  prayer: { foundation: 0.45, formation: 0.35, reproduction: 0.2 },
  memory: { foundation: 0.5, formation: 0.35, reproduction: 0.15 },
  chat: { foundation: 0.2, formation: 0.55, reproduction: 0.25 },
  thirds: { foundation: 0.2, formation: 0.55, reproduction: 0.25 },
  share: { foundation: 0.15, formation: 0.25, reproduction: 0.6 },
};

/** Stage 1 — emphasize Foundation from dailies; community practices stay Formation-strong. */
const STAGE_1_MATRIX: ContributionMatrix = {
  soaps: { foundation: 0.58, formation: 0.27, reproduction: 0.15 },
  prayer: { foundation: 0.52, formation: 0.3, reproduction: 0.18 },
  memory: { foundation: 0.58, formation: 0.27, reproduction: 0.15 },
  chat: { foundation: 0.12, formation: 0.63, reproduction: 0.25 },
  thirds: { foundation: 0.12, formation: 0.63, reproduction: 0.25 },
  share: { foundation: 0.12, formation: 0.28, reproduction: 0.6 },
};

/** Stage 3 — shift dailies toward Formation/Reproduction; CHAT/3/3rds add more Reproduction; share stays outward-heavy. */
const STAGE_3_MATRIX: ContributionMatrix = {
  soaps: { foundation: 0.42, formation: 0.38, reproduction: 0.2 },
  prayer: { foundation: 0.38, formation: 0.4, reproduction: 0.22 },
  memory: { foundation: 0.42, formation: 0.36, reproduction: 0.22 },
  chat: { foundation: 0.1, formation: 0.5, reproduction: 0.4 },
  thirds: { foundation: 0.1, formation: 0.5, reproduction: 0.4 },
  share: { foundation: 0.08, formation: 0.22, reproduction: 0.7 },
};

export const STAGE_CONTRIBUTION_MATRICES: Record<GrowthStageId, ContributionMatrix> = {
  1: STAGE_1_MATRIX,
  2: DEFAULT_CONTRIBUTION_MATRIX,
  3: STAGE_3_MATRIX,
};

/** Ids for explain / tuning — must match what the engine applies after stage detection. */
export const CONTRIBUTION_MATRIX_IDS = {
  provisional: "provisional_default_v1",
  stage1: "stage_1_building_foundation_v1",
  stage2: "stage_2_developing_formation_v1",
  stage3: "stage_3_reproducing_v1",
} as const;

export function appliedMatrixIdForStage(stage: GrowthStageId): string {
  switch (stage) {
    case 1:
      return CONTRIBUTION_MATRIX_IDS.stage1;
    case 2:
      return CONTRIBUTION_MATRIX_IDS.stage2;
    case 3:
      return CONTRIBUTION_MATRIX_IDS.stage3;
    default:
      return CONTRIBUTION_MATRIX_IDS.stage2;
  }
}
