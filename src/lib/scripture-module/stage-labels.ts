import type { MemorizeStage, ReviewStage } from "@/lib/scripture-module/memorize-stage-types";

/** Titles for practice ladder steps 2–5 (memorization and typed review). */
export function practiceStageTitle(stage: "stage_2" | "stage_3" | "stage_4" | "stage_5"): string {
  switch (stage) {
    case "stage_2":
      return "Cumulative phrases";
    case "stage_3":
      return "Every other word (by phrase)";
    case "stage_4":
      return "Every other word (whole passage)";
    case "stage_5":
      return "Full recall (first letters)";
    default:
      return "";
  }
}

/** Short label for memorization progress on verse detail and similar. */
export function memorizationStageShortLabel(stage: MemorizeStage): string {
  switch (stage) {
    case "context":
      return "Context";
    case "stage_2":
      return "Cumulative phrases";
    case "stage_3":
      return "Every other word (phrase)";
    case "stage_4":
      return "Every other word (passage)";
    case "stage_5":
      return "Full recall";
    case "completed":
      return "Complete";
    default:
      return "";
  }
}

/**
 * One line for queue/detail: stage number + title (e.g. "Stage 4 · Every other word (whole passage)").
 */
export function reviewStageLabelLine(stage: ReviewStage | null | undefined): string {
  const s = stage ?? "stage_4";
  const n = s.replace("stage_", "");
  return `Stage ${n} · ${practiceStageTitle(s)}`;
}
