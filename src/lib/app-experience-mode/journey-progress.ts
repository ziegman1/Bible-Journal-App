import type { AppExperienceMode } from "./types";
import {
  isLinearDiscipleshipPathGraduated,
  resolveLinearDiscipleshipPathFromRaw,
  type LinearDiscipleshipPathV1,
} from "@/lib/app-experience-mode/linear-discipleship-path";

/**
 * Placeholder journey state stored in profiles.journey_progress.
 * Expand with new fields; bump `version` when making breaking shape changes and migrate reads.
 */
export interface JourneyProgressV1 {
  version: 1;
  /** 1-based journey phase; drives cumulative unlocks after linear path graduates. */
  currentPhase: number;
  /** Legacy step index (kept for forward-compatible reads). */
  currentStepIndex: number;
  completedStepIds: string[];
  /** Explicit tool slugs (`soaps`, `prayer`, …); merged with phase-derived tools when graduated. */
  unlockedToolIds: string[];
  /** Step-by-step discipleship path before full phased unlocks. */
  linearDiscipleshipPath?: LinearDiscipleshipPathV1;
}

export const DEFAULT_JOURNEY_PROGRESS_V1: JourneyProgressV1 = {
  version: 1,
  currentPhase: 1,
  currentStepIndex: 0,
  completedStepIds: [],
  unlockedToolIds: [],
  linearDiscipleshipPath: {
    version: 1,
    completedKeys: [],
    currentIndex: 0,
  },
};

export function parseJourneyProgress(raw: unknown): JourneyProgressV1 {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_JOURNEY_PROGRESS_V1 };
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return { ...DEFAULT_JOURNEY_PROGRESS_V1 };
  const currentStepIndex =
    typeof o.currentStepIndex === "number" && Number.isFinite(o.currentStepIndex)
      ? Math.max(0, Math.floor(o.currentStepIndex))
      : 0;
  let currentPhase =
    typeof o.currentPhase === "number" && Number.isFinite(o.currentPhase)
      ? Math.max(1, Math.min(5, Math.floor(o.currentPhase)))
      : 0;
  if (currentPhase === 0) {
    currentPhase = currentStepIndex > 0 ? Math.min(5, Math.max(1, currentStepIndex + 1)) : 1;
  }
  const completedStepIds = Array.isArray(o.completedStepIds)
    ? o.completedStepIds.filter((x): x is string => typeof x === "string")
    : [];
  let unlockedToolIds = Array.isArray(o.unlockedToolIds)
    ? o.unlockedToolIds.filter((x): x is string => typeof x === "string")
    : [];

  const linearDiscipleshipPath = resolveLinearDiscipleshipPathFromRaw(raw, {
    currentPhase,
    currentStepIndex,
    completedStepIds,
    unlockedToolIds,
  });

  const linearGraduated = isLinearDiscipleshipPathGraduated(linearDiscipleshipPath);

  if (linearGraduated && unlockedToolIds.length === 0) {
    unlockedToolIds = [...DEFAULT_JOURNEY_PROGRESS_V1.unlockedToolIds];
  }

  return {
    version: 1,
    currentPhase,
    currentStepIndex,
    completedStepIds,
    unlockedToolIds,
    linearDiscipleshipPath,
  };
}

export function journeyProgressForMode(
  mode: AppExperienceMode | null,
  raw: unknown
): JourneyProgressV1 | null {
  if (mode !== "journey") return null;
  return parseJourneyProgress(raw);
}
