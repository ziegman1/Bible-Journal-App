import type { AppExperienceMode } from "@/lib/app-experience-mode/types";

/**
 * SOAPS hub: expand instructional training by default only in guided journey mode.
 * Custom and full (and unknown/null) default to collapsed so “doing” stays primary.
 */
export function soapsTrainingDefaultExpanded(mode: AppExperienceMode | null): boolean {
  return mode === "journey";
}
