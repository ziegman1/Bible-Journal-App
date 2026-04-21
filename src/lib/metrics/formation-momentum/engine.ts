import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import {
  applyCategoryRhythmMultipliersToPerSignal,
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
import { WEEKLY_ANCHOR_UNITS, normalizeEvents } from "@/lib/metrics/formation-momentum/normalization";
import { applyProgressionCategoryGate } from "@/lib/metrics/formation-momentum/progression-gate";
import {
  applyGrowthStageGuardrail,
  countElapsedPillarWeeksInclusive,
  EARLY_WEEKLY_ANCHOR_UNITS,
  MIN_ELAPSED_PILLAR_WEEKS_FOR_STAGE_ESCALATION,
  type GrowthStageGuardrailResult,
} from "@/lib/metrics/formation-momentum/stage-guardrail";
import { detectGrowthStage } from "@/lib/metrics/formation-momentum/stage-detection";
import { applyConsistency } from "@/lib/metrics/formation-momentum/modifiers/consistency";
import { applyGrace } from "@/lib/metrics/formation-momentum/modifiers/grace";
import {
  applyGoalAlignment,
  defaultGoalAlignmentInputGoals,
  loadGoalAlignmentInputGoals,
  type GoalAlignmentInputGoals,
} from "@/lib/metrics/formation-momentum/modifiers/goal-alignment";
import { computeRollingRhythmContext } from "@/lib/metrics/formation-momentum/modifiers/rolling-rhythm";
import { applyRecency } from "@/lib/metrics/formation-momentum/modifiers/recency";
import type {
  CategoryId,
  ComputeFormationMomentumOptions,
  FormationMomentumExplain,
  FormationMomentumSignalExplain,
  ModifiedSignal,
  MomentumSnapshot,
  NormalizedSignal,
  NormalizedSignalExplainSlice,
} from "@/lib/metrics/formation-momentum/types";
import {
  effectiveMetricsStartYmd,
  fetchPracticeMetricsAnchorYmd,
} from "@/lib/profile/practice-metrics-anchor";
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
    graceSignupYmd: string | null;
  }
): ModifiedSignal {
  const rec = applyRecency(signal, { timeZone: ctx.timeZone, now: ctx.now });
  const con = applyConsistency(signal);
  const ga = applyGoalAlignment(signal, { goals: ctx.goals });
  const gr = applyGrace(signal, {
    timeZone: ctx.timeZone,
    now: ctx.now,
    userCreatedAt: ctx.userCreatedAt,
    graceSignupYmd: ctx.graceSignupYmd,
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
    stageGuardrail: FormationMomentumExplain["stageGuardrail"];
    progressionGate: FormationMomentumExplain["progressionGate"];
    rollingRhythmConsistency: FormationMomentumExplain["rollingRhythmConsistency"];
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
    stageGuardrail: stageCtx.stageGuardrail,
    progressionGate: stageCtx.progressionGate,
    rollingRhythmConsistency: stageCtx.rollingRhythmConsistency,
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
 * weakness drag rescales share-derived mass only, then **rolling rhythm** pillar multipliers.
 */
function runStageBasedAggregation(
  modified: readonly ModifiedSignal[],
  normalized: readonly NormalizedSignal[],
  timeZone: string,
  now: Date,
  guardInputs: {
    elapsedPillarWeeks: number;
    /** Capped `1 + cap×score` multipliers per pillar; applied to category masses only. */
    rhythmMultipliers: Record<CategoryId, number>;
  }
): {
  totals: ReturnType<typeof applyCategoryRhythmMultipliersToPerSignal>["totals"];
  perSignal: ReturnType<typeof applyCategoryRhythmMultipliersToPerSignal>["perSignal"];
  provisionalTotals: { foundation: number; formation: number; reproduction: number };
  growthGuard: GrowthStageGuardrailResult;
  appliedMatrixId: string;
  sharingModel: ReturnType<typeof evaluateSharingImpactModel>;
  shareOnlyTotalsBeforeDrag: {
    foundation: number;
    formation: number;
    reproduction: number;
  };
} {
  const provisional = applyMatrixWithPerSignalContributions(
    modified,
    DEFAULT_CONTRIBUTION_MATRIX
  );
  const provisionalDetection = detectGrowthStage(provisional.totals);
  const growthGuard = applyGrowthStageGuardrail(
    provisionalDetection,
    guardInputs.elapsedPillarWeeks,
    normalized.length
  );
  const appliedMatrix = STAGE_CONTRIBUTION_MATRICES[growthGuard.stage];
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
  const afterRhythm = applyCategoryRhythmMultipliersToPerSignal(
    afterDrag.perSignal,
    guardInputs.rhythmMultipliers
  );

  return {
    totals: afterRhythm.totals,
    perSignal: afterRhythm.perSignal,
    provisionalTotals: provisional.totals,
    growthGuard,
    appliedMatrixId: appliedMatrixIdForStage(growthGuard.stage),
    sharingModel,
    shareOnlyTotalsBeforeDrag: beforeDrag.shareOnlyTotals,
  };
}

/**
 * End-to-end formation momentum (full v1 modifier chain: recency, consistency, goal alignment, grace).
 *
 * After stage matrix + sharing + **rolling rhythm** pillar multipliers, {@link applyProgressionCategoryGate}
 * ramps Formation with Foundation’s **staged** (pre-gate) share and ramps Reproduction with both Foundation
 * and Formation staged shares. Foundation column is never scaled by the gate. Stage detection inputs are unchanged.
 *
 * Pass `{ explain: true }` to attach structured pipeline inspection data (server-side tuning; not for end-user UI yet).
 */
export async function computeFormationMomentum(
  userId: string,
  options?: ComputeFormationMomentumOptions
): Promise<MomentumSnapshot> {
  const now = new Date();
  const supabase = await createClient();
  const [tz, goals, authUser, anchorYmd] = await Promise.all([
    getPracticeTimeZone(),
    supabase ? loadGoalAlignmentInputGoals(supabase, userId) : Promise.resolve(defaultGoalAlignmentInputGoals()),
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
    supabase ? fetchPracticeMetricsAnchorYmd(supabase, userId) : Promise.resolve(null),
  ]);

  const { events } = await getUserPracticeEvents(userId, {
    practiceMetricsAnchorYmd: anchorYmd,
  });

  const userCreatedAt =
    authUser.data.user?.id === userId ? authUser.data.user.created_at ?? null : null;

  const graceSignupYmd = effectiveMetricsStartYmd(userCreatedAt, anchorYmd, tz);
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const elapsedPillarWeeks = countElapsedPillarWeeksInclusive(
    graceSignupYmd,
    todayYmd,
    tz
  );
  const weeklyAnchorUnitsForChatAndThirds =
    elapsedPillarWeeks < MIN_ELAPSED_PILLAR_WEEKS_FOR_STAGE_ESCALATION
      ? EARLY_WEEKLY_ANCHOR_UNITS
      : WEEKLY_ANCHOR_UNITS;

  const normalized = normalizeEvents(events, {
    timeZone: tz,
    now,
    weeklyAnchorUnitsForChatAndThirds,
  });
  const modified: ModifiedSignal[] = normalized.map((s) =>
    applyModifiers(s, {
      timeZone: tz,
      now,
      goals,
      allSignals: normalized,
      userCreatedAt,
      graceSignupYmd,
    })
  );

  const wantExplain = options?.explain === true;

  const rhythmCtx = computeRollingRhythmContext(normalized, goals, tz, now);
  const rhythmMultipliers: Record<CategoryId, number> = {
    foundation: rhythmCtx.foundationConsistencyMultiplier,
    formation: rhythmCtx.formationConsistencyMultiplier,
    reproduction: rhythmCtx.reproductionConsistencyMultiplier,
  };

  const staged = runStageBasedAggregation(modified, normalized, tz, now, {
    elapsedPillarWeeks,
    rhythmMultipliers,
  });

  const progression = applyProgressionCategoryGate(staged.totals, staged.perSignal);
  const aggregates = progression.totals;

  const explain: FormationMomentumExplain | undefined = wantExplain
    ? buildExplain(normalized, modified, progression.totals, progression.perSignal, {
        provisionalCategoryTotals: staged.provisionalTotals,
        provisionalShares: staged.growthGuard.shares,
        growthStage: { id: staged.growthGuard.stage, label: staged.growthGuard.label },
        stageGuardrail: {
          forcedToFoundation: staged.growthGuard.forcedToFoundation,
          reason: staged.growthGuard.reason,
          elapsedPillarWeeks: staged.growthGuard.elapsedPillarWeeks,
          normalizedSignalCount: staged.growthGuard.normalizedSignalCount,
          provisionalStageId: staged.growthGuard.provisionalStageId,
        },
        progressionGate: {
          preGateTotals: progression.preGateTotals,
          postGateTotals: progression.postGateTotals,
          foundationProgressForUnlock: progression.foundationProgressForUnlock,
          formationProgressForReproductionUnlock: progression.formationProgressForReproductionUnlock,
          unlockThreshold: progression.unlockThreshold,
          formationReproductionUnlockThreshold: progression.formationReproductionUnlockThreshold,
          foundationUnlockReached: progression.foundationUnlockReached,
          formationReproductionUnlockReached: progression.formationReproductionUnlockReached,
          formationGated: progression.formationGated,
          formationMultiplier: progression.formationMultiplier,
          reproductionFoundationMultiplier: progression.reproductionFoundationMultiplier,
          reproductionFormationMultiplier: progression.reproductionFormationMultiplier,
          reproductionMultiplier: progression.reproductionMultiplier,
        },
        rollingRhythmConsistency: {
          rollingConsistencyLookbackWeeks: rhythmCtx.rollingConsistencyLookbackWeeks,
          rollingFoundationScore: rhythmCtx.rollingFoundationScore,
          rollingFormationScore: rhythmCtx.rollingFormationScore,
          rollingReproductionScore: rhythmCtx.rollingReproductionScore,
          foundationConsistencyMultiplier: rhythmCtx.foundationConsistencyMultiplier,
          formationConsistencyMultiplier: rhythmCtx.formationConsistencyMultiplier,
          reproductionConsistencyMultiplier: rhythmCtx.reproductionConsistencyMultiplier,
          foundationWeeklyRhythm: rhythmCtx.foundationWeeklyRhythm,
          formationWeeklyRhythm: rhythmCtx.formationWeeklyRhythm,
          reproductionWeeklyRhythm: rhythmCtx.reproductionWeeklyRhythm,
          formationRhythmModelNote: rhythmCtx.formationRhythmModelNote,
        },
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
      growthStageId: staged.growthGuard.stage,
      growthStageLabel: staged.growthGuard.label,
      appliedMatrixId: staged.appliedMatrixId,
    },
    ...(explain ? { explain } : {}),
  };
}
