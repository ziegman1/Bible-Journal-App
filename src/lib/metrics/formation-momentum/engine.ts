import "server-only";

import {
  applyMatrixWithPerSignalContributions,
  applyMatrixWithShareRowOverride,
  applyShareDragToPerSignalAndTotals,
  computeCategoryScores,
} from "@/lib/metrics/formation-momentum/aggregator";
import { evaluateSharingImpactModel } from "@/lib/metrics/formation-momentum/sharing-impact";
import { getUserPracticeEvents } from "@/lib/metrics/formation-momentum/ingestion";
import {
  appliedMatrixIdForStage,
  CONTRIBUTION_MATRIX_IDS,
  DEFAULT_CONTRIBUTION_MATRIX,
  STAGE_CONTRIBUTION_MATRICES,
} from "@/lib/metrics/formation-momentum/matrix";
import { detectGrowthStage } from "@/lib/metrics/formation-momentum/stage-detection";
import { applyConsistency } from "@/lib/metrics/formation-momentum/modifiers/consistency";
import { applyGrace } from "@/lib/metrics/formation-momentum/modifiers/grace";
import {
  applyGoalAlignment,
  defaultGoalAlignmentInputGoals,
  loadGoalAlignmentInputGoals,
  type GoalAlignmentInputGoals,
} from "@/lib/metrics/formation-momentum/modifiers/goal-alignment";
import { applyRecency } from "@/lib/metrics/formation-momentum/modifiers/recency";
import { normalizeEvents } from "@/lib/metrics/formation-momentum/normalization";
import type {
  ComputeFormationMomentumOptions,
  FormationMomentumExplain,
  FormationMomentumSignalExplain,
  ModifiedSignal,
  MomentumSnapshot,
  NormalizedSignal,
  NormalizedSignalExplainSlice,
} from "@/lib/metrics/formation-momentum/types";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

function applyModifiers(
  signal: NormalizedSignal,
  ctx: {
    timeZone: string;
    now: Date;
    goals: GoalAlignmentInputGoals;
    allSignals: readonly NormalizedSignal[];
    userCreatedAt: string | null;
  }
): ModifiedSignal {
  const rec = applyRecency(signal, { timeZone: ctx.timeZone, now: ctx.now });
  const con = applyConsistency(signal);
  const ga = applyGoalAlignment(signal, { goals: ctx.goals });
  const gr = applyGrace(signal, {
    timeZone: ctx.timeZone,
    now: ctx.now,
    userCreatedAt: ctx.userCreatedAt,
    signalWeeksAgo: rec.weeksAgo,
    allSignals: ctx.allSignals,
  });

  const baseValue = signal.totalUnits;
  const modifierBreakdown = {
    recency: rec.factor,
    consistency: con.factor,
    grace: gr.factor,
    goalAlignment: ga.factor,
  };

  const effectiveValue =
    baseValue * rec.factor * con.factor * ga.factor * gr.factor;
  const effectiveWeight = effectiveValue;

  const consistencyMeta = {
    pattern: con.pattern,
    daysWithActivityUsed: con.daysWithActivityUsed,
    dailyTier: con.dailyTier,
    weeklyHadActivity: con.weeklyHadActivity,
  };

  const goalAlignmentMeta = {
    mode: ga.mode,
    actual: ga.actual,
    goalTargetUsed: ga.goalTargetUsed,
    rawRatio: ga.rawRatio,
  };

  const graceMeta = {
    bonusApplied: gr.bonusApplied,
    reasons: gr.reasons,
  };

  return {
    ...signal,
    baseValue,
    originalWindowKey: signal.windowKey,
    recencyFactor: rec.factor,
    recencyWeeksAgo: rec.weeksAgo,
    consistencyFactor: con.factor,
    consistencyMeta,
    goalAlignmentFactor: ga.factor,
    goalAlignmentMeta,
    graceFactor: gr.factor,
    graceMeta,
    modifierBreakdown,
    effectiveValue,
    effectiveWeight,
  };
}

function buildExplain(
  normalized: readonly NormalizedSignal[],
  modified: readonly ModifiedSignal[],
  matrixTotals: {
    foundation: number;
    formation: number;
    reproduction: number;
  },
  perSignal: ReadonlyArray<{
    signalId: string;
    foundation: number;
    formation: number;
    reproduction: number;
  }>,
  stageCtx: {
    provisionalCategoryTotals: {
      foundation: number;
      formation: number;
      reproduction: number;
    };
    provisionalShares: {
      foundation: number;
      formation: number;
      reproduction: number;
    };
    growthStage: { id: 1 | 2 | 3; label: string };
    appliedMatrixId: string;
    sharingImpact: FormationMomentumExplain["sharingImpact"];
  }
): FormationMomentumExplain {
  const contribById = new Map(
    perSignal.map((p) => [
      p.signalId,
      {
        foundation: p.foundation,
        formation: p.formation,
        reproduction: p.reproduction,
      },
    ])
  );

  const normalizedSignals: NormalizedSignalExplainSlice[] = normalized.map((n) => ({
    id: n.id,
    practiceType: n.practiceType,
    subtype: n.subtype,
    windowKey: n.windowKey,
    totalUnits: n.totalUnits,
    qualifyingUnits: n.qualifyingUnits,
    daysWithActivity: n.daysWithActivity,
  }));

  const signals: FormationMomentumSignalExplain[] = modified.map((s) => ({
    signalId: s.id,
    practiceType: s.practiceType,
    subtype: s.subtype,
    windowKey: s.windowKey,
    baseValue: s.baseValue,
    totalUnits: s.totalUnits,
    qualifyingUnits: s.qualifyingUnits,
    daysWithActivity: s.daysWithActivity,
    recencyFactor: s.recencyFactor,
    consistencyFactor: s.consistencyFactor,
    goalAlignmentFactor: s.goalAlignmentFactor,
    graceFactor: s.graceFactor,
    effectiveValue: s.effectiveValue,
    effectiveWeight: s.effectiveWeight,
    categoryContribution:
      contribById.get(s.id) ?? {
        foundation: 0,
        formation: 0,
        reproduction: 0,
      },
  }));

  const categoryTotals = {
    foundation: matrixTotals.foundation,
    formation: matrixTotals.formation,
    reproduction: matrixTotals.reproduction,
  };

  const overallTotal =
    categoryTotals.foundation + categoryTotals.formation + categoryTotals.reproduction;

  return {
    provisionalMatrixId: CONTRIBUTION_MATRIX_IDS.provisional,
    provisionalCategoryTotals: stageCtx.provisionalCategoryTotals,
    provisionalShares: stageCtx.provisionalShares,
    growthStage: stageCtx.growthStage,
    contributionMatrixId: stageCtx.appliedMatrixId,
    sharingImpact: stageCtx.sharingImpact,
    normalizedSignals,
    signals,
    categoryTotals,
    overallTotal,
  };
}

/**
 * Provisional pass uses the baseline matrix for category-balance → growth stage (unchanged).
 * Final pass applies the stage matrix for all practices **except share**: share uses the
 * progressive sharing-impact profile from {@link evaluateSharingImpactModel}, then bounded
 * weakness drag rescales share-derived mass only.
 */
function runStageBasedAggregation(
  modified: readonly ModifiedSignal[],
  normalized: readonly NormalizedSignal[],
  timeZone: string,
  now: Date
) {
  const provisional = applyMatrixWithPerSignalContributions(
    modified,
    DEFAULT_CONTRIBUTION_MATRIX
  );
  const detection = detectGrowthStage(provisional.totals);
  const appliedMatrix = STAGE_CONTRIBUTION_MATRICES[detection.stage];
  const sharingModel = evaluateSharingImpactModel(normalized, timeZone, now);

  const beforeDrag = applyMatrixWithShareRowOverride(
    modified,
    appliedMatrix,
    sharingModel.profileRow
  );
  const afterDrag = applyShareDragToPerSignalAndTotals(
    beforeDrag.perSignal,
    modified,
    sharingModel.dragMultipliers
  );

  return {
    totals: afterDrag.totals,
    perSignal: afterDrag.perSignal,
    provisionalTotals: provisional.totals,
    detection,
    appliedMatrixId: appliedMatrixIdForStage(detection.stage),
    sharingModel,
    shareOnlyTotalsBeforeDrag: beforeDrag.shareOnlyTotals,
  };
}

/**
 * End-to-end formation momentum (full v1 modifier chain: recency, consistency, goal alignment, grace).
 *
 * Pass `{ explain: true }` to attach structured pipeline inspection data (server-side tuning; not for end-user UI yet).
 */
export async function computeFormationMomentum(
  userId: string,
  options?: ComputeFormationMomentumOptions
): Promise<MomentumSnapshot> {
  const now = new Date();
  const supabase = await createClient();
  const [{ events }, tz, goals, authUser] = await Promise.all([
    getUserPracticeEvents(userId),
    getPracticeTimeZone(),
    supabase ? loadGoalAlignmentInputGoals(supabase, userId) : Promise.resolve(defaultGoalAlignmentInputGoals()),
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
  ]);

  const userCreatedAt =
    authUser.data.user?.id === userId ? authUser.data.user.created_at ?? null : null;

  const normalized = normalizeEvents(events, { timeZone: tz, now });
  const modified: ModifiedSignal[] = normalized.map((s) =>
    applyModifiers(s, {
      timeZone: tz,
      now,
      goals,
      allSignals: normalized,
      userCreatedAt,
    })
  );

  const wantExplain = options?.explain === true;

  const staged = runStageBasedAggregation(modified, normalized, tz, now);
  const aggregates = staged.totals;

  const explain: FormationMomentumExplain | undefined = wantExplain
    ? buildExplain(normalized, modified, staged.totals, staged.perSignal, {
        provisionalCategoryTotals: staged.provisionalTotals,
        provisionalShares: staged.detection.shares,
        growthStage: { id: staged.detection.stage, label: staged.detection.label },
        appliedMatrixId: staged.appliedMatrixId,
        sharingImpact: {
          windowPillarWeeks: staged.sharingModel.windowPillarWeeks,
          weeksWithShareActivity: staged.sharingModel.weeksWithShareActivity,
          level: {
            id: staged.sharingModel.level,
            key: staged.sharingModel.levelKey,
            label: staged.sharingModel.levelLabel,
          },
          profileId: staged.sharingModel.profileId,
          profileRow: staged.sharingModel.profileRow,
          dragMultipliers: staged.sharingModel.dragMultipliers,
          weaknessDragApplied: staged.sharingModel.dragApplied,
          reproductionDragApplied: staged.sharingModel.dragMultipliers.reproduction < 1,
          shareOnlyTotalsBeforeDrag: staged.shareOnlyTotalsBeforeDrag,
        },
      })
    : undefined;

  const categories = computeCategoryScores(aggregates);

  return {
    userId,
    computedAt: now.toISOString(),
    categories,
    meta: {
      signalCount: normalized.length,
      modifiedSignalCount: modified.length,
      growthStageId: staged.detection.stage,
      growthStageLabel: staged.detection.label,
      appliedMatrixId: staged.appliedMatrixId,
    },
    ...(explain ? { explain } : {}),
  };
}
