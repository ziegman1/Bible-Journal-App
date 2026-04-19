import type { ReviewStage } from "@/lib/scripture-module/memorize-stage-types";

const ORDER: readonly ReviewStage[] = ["stage_2", "stage_3", "stage_4", "stage_5"];

/**
 * Review sessions start at Stage 4 (initial retention difficulty).
 *
 * On **fail** (accuracy &lt; 90%): drop one stage (floor at stage_2).
 * On **pass**: advance one stage toward stage_5; at stage_5 pass → `null` (session complete; caller schedules next due date).
 *
 * `current` is the stage just attempted.
 */
export function nextReviewStageAfterResult(
  current: ReviewStage,
  passed: boolean
): ReviewStage | null {
  const idx = ORDER.indexOf(current);
  if (idx < 0) return INITIAL_REVIEW_STAGE;

  if (!passed) {
    const dropped = Math.max(0, idx - 1);
    return ORDER[dropped]!;
  }

  if (current === "stage_5") {
    return null;
  }

  return ORDER[idx + 1]!;
}

/** First review after memorization completes should begin at Stage 4. */
export const INITIAL_REVIEW_STAGE: ReviewStage = "stage_4";
