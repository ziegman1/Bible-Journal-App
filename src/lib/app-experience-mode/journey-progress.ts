import type { AppExperienceMode } from "./types";

/**
 * Placeholder journey state stored in profiles.journey_progress.
 * Expand with new fields; bump `version` when making breaking shape changes and migrate reads.
 */
export interface JourneyProgressV1 {
  version: 1;
  currentStepIndex: number;
  completedStepIds: string[];
  unlockedToolIds: string[];
}

export const DEFAULT_JOURNEY_PROGRESS_V1: JourneyProgressV1 = {
  version: 1,
  currentStepIndex: 0,
  completedStepIds: [],
  unlockedToolIds: [],
};

export function parseJourneyProgress(raw: unknown): JourneyProgressV1 {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_JOURNEY_PROGRESS_V1 };
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return { ...DEFAULT_JOURNEY_PROGRESS_V1 };
  const currentStepIndex =
    typeof o.currentStepIndex === "number" && Number.isFinite(o.currentStepIndex)
      ? Math.max(0, Math.floor(o.currentStepIndex))
      : 0;
  const completedStepIds = Array.isArray(o.completedStepIds)
    ? o.completedStepIds.filter((x): x is string => typeof x === "string")
    : [];
  const unlockedToolIds = Array.isArray(o.unlockedToolIds)
    ? o.unlockedToolIds.filter((x): x is string => typeof x === "string")
    : [];
  return { version: 1, currentStepIndex, completedStepIds, unlockedToolIds };
}

export function journeyProgressForMode(
  mode: AppExperienceMode | null,
  raw: unknown
): JourneyProgressV1 | null {
  if (mode !== "journey") return null;
  return parseJourneyProgress(raw);
}
