import {
  enumeratePillarWeekStartYmids,
  pillarWeekStartKeyFromDateYmd,
} from "@/lib/dashboard/pillar-week";
import type { GrowthStageDetection } from "@/lib/metrics/formation-momentum/stage-detection";
import { GROWTH_STAGE_LABEL } from "@/lib/metrics/formation-momentum/stage-detection";
import type { GrowthStageId } from "@/lib/metrics/formation-momentum/types";

/**
 * Need at least this many elapsed pillar weeks (inclusive from metrics start through today)
 * before provisional stage detection may elevate beyond Foundation (stage 1).
 */
export const MIN_ELAPSED_PILLAR_WEEKS_FOR_STAGE_ESCALATION = 2;

/**
 * Need at least this many normalized window signals before stage may escalate — avoids
 * misleading Formation-dominant splits from a handful of strong weekly rows on day 1.
 */
export const MIN_NORMALIZED_SIGNALS_FOR_STAGE_ESCALATION = 6;

/** 3/3rds + CHAT weekly mass in stage 1 (before modifiers); full anchor is 6 in later weeks. */
export const EARLY_WEEKLY_ANCHOR_UNITS = 3.5;

export function countElapsedPillarWeeksInclusive(
  effectiveStartYmd: string,
  todayYmd: string,
  timeZone: string
): number {
  const first = pillarWeekStartKeyFromDateYmd(effectiveStartYmd, timeZone);
  const last = pillarWeekStartKeyFromDateYmd(todayYmd, timeZone);
  if (first > last) return 0;
  return enumeratePillarWeekStartYmids(first, last).length;
}

export type GrowthStageGuardrailResult = {
  stage: GrowthStageId;
  label: string;
  shares: GrowthStageDetection["shares"];
  /** True when we kept stage 1 (or forced down from 2/3) so early users stay Foundation-dominant. */
  forcedToFoundation: boolean;
  /** Human-readable; null when not forced. */
  reason: string | null;
  elapsedPillarWeeks: number;
  normalizedSignalCount: number;
  /** Stage that provisional category shares would have selected without the guardrail. */
  provisionalStageId: GrowthStageId;
};

/**
 * Prevents premature stage 2/3 when little history exists, even if weekly anchors (e.g. 3/3rds)
 * inflate Formation in provisional totals. Does not remove matrices — only caps elevation.
 */
export function applyGrowthStageGuardrail(
  provisionalDetection: GrowthStageDetection,
  elapsedPillarWeeks: number,
  normalizedSignalCount: number
): GrowthStageGuardrailResult {
  const { stage: provisionalStageId, shares } = provisionalDetection;

  const tooSoonWeeks = elapsedPillarWeeks < MIN_ELAPSED_PILLAR_WEEKS_FOR_STAGE_ESCALATION;
  const tooFewSignals = normalizedSignalCount < MIN_NORMALIZED_SIGNALS_FOR_STAGE_ESCALATION;

  if (provisionalStageId === 1) {
    return {
      stage: 1,
      label: GROWTH_STAGE_LABEL[1],
      shares,
      forcedToFoundation: false,
      reason: null,
      elapsedPillarWeeks,
      normalizedSignalCount,
      provisionalStageId,
    };
  }

  if (tooSoonWeeks || tooFewSignals) {
    const reason = tooSoonWeeks
      ? `Fewer than ${MIN_ELAPSED_PILLAR_WEEKS_FOR_STAGE_ESCALATION} elapsed pillar weeks since metrics start (${elapsedPillarWeeks}).`
      : `Normalized signal count below ${MIN_NORMALIZED_SIGNALS_FOR_STAGE_ESCALATION} (${normalizedSignalCount}); holding Foundation stage until there is enough history.`;

    return {
      stage: 1,
      label: GROWTH_STAGE_LABEL[1],
      shares,
      forcedToFoundation: true,
      reason,
      elapsedPillarWeeks,
      normalizedSignalCount,
      provisionalStageId,
    };
  }

  return {
    stage: provisionalStageId,
    label: provisionalDetection.label,
    shares,
    forcedToFoundation: false,
    reason: null,
    elapsedPillarWeeks,
    normalizedSignalCount,
    provisionalStageId,
  };
}
