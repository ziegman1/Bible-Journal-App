/**
 * **Discipleship Momentum card — primary summary instruction** (presentation only).
 *
 * Branches on discipleship **stage** and engine signals so early users see concrete guidance instead of
 * generic “focus on Formation.” Later stages should use different paths — extend `DiscipleshipInstructionKind`
 * and `resolveDiscipleshipMomentumInstruction`.
 *
 * **Scope honesty:** Card copy describes rhythms the **formation-momentum engine** can reflect (SOAPS, prayer,
 * Scripture memory, CHAT, 3/3rds, logged share encounters per `ingestion.ts`). It must **not** imply separate
 * products (e.g. list-of-100 workflows) are scored unless wired into that pipeline.
 */

import { scoreToBenchmarkProgress } from "@/lib/metrics/formation-momentum/benchmarks";
import { FOUNDATION_PROGRESS_UNLOCK_THRESHOLD } from "@/lib/metrics/formation-momentum/progression-gate";
import type { CategoryId, FormationMomentumExplain, GrowthStageId } from "@/lib/metrics/formation-momentum/types";

const CATEGORY_LABEL: Record<CategoryId, string> = {
  foundation: "Foundation",
  formation: "Formation",
  reproduction: "Reproduction",
};

/**
 * Pastoral + accurate: encourages rhythms that **are** engine inputs. Wider discipleship habits (prayer lists,
 * oikos, etc.) belong in other UI — not stated here as part of this score.
 */
export const EARLY_FOUNDATION_SUMMARY_LINE =
  "Keep focusing on growing in your Foundation by doing your SOAPS, praying, practicing Scripture memory, and meeting with your 3/3rds and CHAT rhythms consistently. As you log sharing encounters, Reproduction will grow alongside those habits.";

export type DiscipleshipInstructionKind =
  | "early_foundation"
  /** Default: strongest vs weakest category (extensible with formation_focus, reproduction_focus, …). */
  | "category_balance";

export type DiscipleshipMomentumInstructionResult = {
  kind: DiscipleshipInstructionKind;
  /** Single paragraph shown under the three gauges. */
  summaryLine: string;
};

export type ResolveDiscipleshipMomentumInstructionArgs = {
  strongest: CategoryId;
  weakest: CategoryId;
  /** From `snapshot.meta` — engine growth stage after guardrails. */
  growthStageId?: GrowthStageId;
  /** Raw Foundation category mass (same as phase gauge input). */
  foundationScore: number;
  /** When present (dashboard card uses `explain: true`), unlocks progression-gate signals. */
  explain?: FormationMomentumExplain;
};

/**
 * True when we should show **early Foundation** coaching instead of generic category balance.
 * Uses OR of: growth stage 1, Foundation staged share still below unlock threshold, or Foundation mass in the
 * first benchmark band (presentation layer).
 */
export function isEarlyFoundationInstructionPath(
  args: ResolveDiscipleshipMomentumInstructionArgs
): boolean {
  const { growthStageId, foundationScore, explain } = args;

  if (growthStageId === 1) return true;

  if (explain?.progressionGate?.formationGated === true) return true;

  const fp = explain?.progressionGate?.foundationProgressForUnlock;
  if (typeof fp === "number" && fp < FOUNDATION_PROGRESS_UNLOCK_THRESHOLD) return true;

  const bench = scoreToBenchmarkProgress(foundationScore);
  if (
    bench.levelIndex === 0 &&
    (growthStageId === undefined || growthStageId < 3)
  ) {
    return true;
  }

  return false;
}

function categoryBalanceLine(strongest: CategoryId, weakest: CategoryId): string {
  return `You are strongest in ${CATEGORY_LABEL[strongest]}. Focus next on growing in ${CATEGORY_LABEL[weakest]}.`;
}

/**
 * Resolves which instruction path applies and the summary string for the Discipleship Momentum card.
 */
export function resolveDiscipleshipMomentumInstruction(
  args: ResolveDiscipleshipMomentumInstructionArgs
): DiscipleshipMomentumInstructionResult {
  if (isEarlyFoundationInstructionPath(args)) {
    return { kind: "early_foundation", summaryLine: EARLY_FOUNDATION_SUMMARY_LINE };
  }
  return {
    kind: "category_balance",
    summaryLine: categoryBalanceLine(args.strongest, args.weakest),
  };
}
