/** Memorization ladder (initial learning). */
export type MemorizeStage =
  | "context"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "stage_5"
  | "completed";

/** Review ladder (retention); first session starts at stage_4. */
export type ReviewStage = "stage_2" | "stage_3" | "stage_4" | "stage_5";

/**
 * Versioned JSON stored in `scripture_item_memory.memorize_progress`.
 * Extend with new `v` when breaking; keep old keys readable in mappers.
 */
export type MemorizeProgressV1 = {
  v: 1;
  /** Optional flags while still in context (paraphrase/meaning vs phrases). */
  context?: {
    paraphraseAndMeaningSaved?: boolean;
  };
  /** Stage 2: cumulative phrase ladder + reps per micro-step (usually 3; 2 for long passages). */
  stage2?: {
    stepIndex: number;
    /** Rep counter within the current micro-step (resets when step advances). */
    repIndex: number;
  };
  /** Stage 3: phrase-by-phrase, two masking rounds per phrase. */
  stage3?: {
    phraseIndex: number;
    /** 0 = odd-indexed words hidden (1-based word positions); 1 = even hidden. */
    roundIndex: 0 | 1;
  };
  /** Stage 4 / 5: reserved for future resume tokens (single-pass for now). */
  stage4?: Record<string, unknown>;
  stage5?: Record<string, unknown>;
};
