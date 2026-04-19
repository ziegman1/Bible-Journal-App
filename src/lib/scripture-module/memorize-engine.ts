/**
 * Pure orchestration for memorization + review typing rounds (word-level first letters).
 * UI supplies `letterSlots` aligned to the active word list for the current sub-step.
 */

import type { MemorizeProgressV1, MemorizeStage, ReviewStage } from "@/lib/scripture-module/memorize-stage-types";
import {
  scoreRoundFromWordBooleans,
  scoreWordFirstLetter,
  type WordRoundPassRule,
} from "@/lib/scripture-module/memorize-scoring-engine";
import {
  advanceStage2Progress,
  buildStage2MicroSteps,
  stage2RepsPerMicroStep,
  type Stage2MicroStep,
} from "@/lib/scripture-module/stage2-cumulative";
import { wordsFromPhraseSegments } from "@/lib/scripture-module/memorize-words";
import {
  INITIAL_REVIEW_STAGE,
  nextReviewStageAfterResult,
} from "@/lib/scripture-module/review-stage-progression";
import {
  addDaysIsoFromNow,
  daysForReviewIntervalIndex,
  nextIntervalIndexAfterCompletedCycle,
} from "@/lib/scripture-module/review-interval-schedule";

export type MemorizeRoundResult =
  | {
      kind: "memorize";
      passed: boolean;
      accuracy: number;
      nextStage: MemorizeStage;
      nextProgress: MemorizeProgressV1 | null;
    }
  | {
      kind: "review";
      passed: boolean;
      accuracy: number;
      nextReviewStage: ReviewStage;
      nextReviewProgress: MemorizeProgressV1 | null;
      reviewSessionComplete: boolean;
      nextIntervalIndex: number;
      nextHoldAtIso: string | null;
    };

function defaultProgressV1(): MemorizeProgressV1 {
  return { v: 1 };
}

function wordsForPhrase(segments: string[], phraseIndex: number): string[] {
  const seg = segments[phraseIndex];
  if (seg == null || !String(seg).trim()) return [];
  return wordsFromPhraseSegments([seg]);
}

export function wordsForStage2MicroStep(segments: string[], step: Stage2MicroStep): string[] {
  if (step.kind === "single") {
    return wordsForPhrase(segments, step.phraseIndex);
  }
  const out: string[] = [];
  for (let p = 0; p <= step.endPhraseIndex; p++) {
    out.push(...wordsForPhrase(segments, p));
  }
  return out;
}

export function parseMemorizeProgress(raw: unknown): MemorizeProgressV1 {
  if (raw == null || typeof raw !== "object") return defaultProgressV1();
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return defaultProgressV1();
  return raw as MemorizeProgressV1;
}

/** In-progress memorize ladder (steps 1–5); excludes `completed`. */
export type MemorizeLadderTargetStage = Exclude<MemorizeStage, "completed">;

export type MemorizeLadderStepNumber = 1 | 2 | 3 | 4 | 5;

export function defaultMemorizeProgressForLadderStage(stage: MemorizeLadderTargetStage): MemorizeProgressV1 {
  switch (stage) {
    case "context":
      return { v: 1 };
    case "stage_2":
      return { v: 1, stage2: { stepIndex: 0, repIndex: 0 } };
    case "stage_3":
      return { v: 1, stage3: { phraseIndex: 0, roundIndex: 0 } };
    case "stage_4":
      return { v: 1, stage4: {} };
    case "stage_5":
      return { v: 1, stage5: {} };
  }
}

export function ladderStepToMemorizeStage(step: MemorizeLadderStepNumber): MemorizeLadderTargetStage {
  switch (step) {
    case 1:
      return "context";
    case 2:
      return "stage_2";
    case 3:
      return "stage_3";
    case 4:
      return "stage_4";
    case 5:
      return "stage_5";
  }
}

export function memorizeStageToLadderStep(stage: MemorizeStage): MemorizeLadderStepNumber | null {
  switch (stage) {
    case "context":
      return 1;
    case "stage_2":
      return 2;
    case "stage_3":
      return 3;
    case "stage_4":
      return 4;
    case "stage_5":
      return 5;
    default:
      return null;
  }
}

/** When jumping between ladder steps: reset sub-step progress; keep context flags if returning to step 1. */
export function memorizeProgressForLadderJump(
  target: MemorizeLadderTargetStage,
  previousRaw: unknown
): MemorizeProgressV1 {
  const previous = parseMemorizeProgress(previousRaw);
  const base = defaultMemorizeProgressForLadderStage(target);
  if (target === "context" && previous.context) {
    return { ...base, context: previous.context };
  }
  return base;
}

export type ActiveRecallWordsOpts = {
  /** Normalized reference token (per-character scoring); only wraps stages 4–5 when non-empty. */
  referenceTypingToken?: string | null;
};

function wrapWholePassageWordsWithReference(
  stage: MemorizeStage | ReviewStage,
  passageWords: string[],
  token: string | null | undefined
): string[] {
  if ((stage !== "stage_4" && stage !== "stage_5") || !token?.trim()) {
    return passageWords;
  }
  const t = token.trim().split("");
  return [...t, ...passageWords, ...t];
}

/** Active words the client should collect first-letter slots for (memorization path). */
export function activeMemorizeWords(
  stage: MemorizeStage,
  segments: string[],
  progress: MemorizeProgressV1,
  opts?: ActiveRecallWordsOpts
): string[] {
  const phraseCount = segments.length;
  const words = () => wordsFromPhraseSegments(segments);

  switch (stage) {
    case "context":
      return [];
    case "stage_2": {
      const steps = buildStage2MicroSteps(phraseCount);
      const s2 = progress.stage2 ?? { stepIndex: 0, repIndex: 0 };
      const idx = Math.min(s2.stepIndex, Math.max(0, steps.length - 1));
      const step = steps[idx];
      return step ? wordsForStage2MicroStep(segments, step) : [];
    }
    case "stage_3": {
      const s3 = progress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
      const pi = Math.min(Math.max(0, s3.phraseIndex), Math.max(0, phraseCount - 1));
      return wordsForPhrase(segments, pi);
    }
    case "stage_4":
    case "stage_5":
      return wrapWholePassageWordsWithReference(stage, words(), opts?.referenceTypingToken);
    default:
      return [];
  }
}

/** Same word selection for a review ladder step (uses ReviewStage + shared progress shape). */
export function activeReviewWords(
  reviewStage: ReviewStage,
  segments: string[],
  progress: MemorizeProgressV1,
  opts?: ActiveRecallWordsOpts
): string[] {
  return activeMemorizeWords(reviewStage as MemorizeStage, segments, progress, opts);
}

function scoreSlotsAgainstWords(
  words: string[],
  letterSlots: string[],
  passRule: import("@/lib/scripture-module/memorize-scoring-engine").WordRoundPassRule
): { accuracy: number; passed: boolean } {
  const results = words.map((w, i) => scoreWordFirstLetter(w, letterSlots[i] ?? ""));
  const { accuracy, passed } = scoreRoundFromWordBooleans(results, undefined, passRule);
  return { accuracy, passed };
}

function shellProgressForReviewStage(stage: ReviewStage): MemorizeProgressV1 {
  const p: MemorizeProgressV1 = { v: 1 };
  if (stage === "stage_2") p.stage2 = { stepIndex: 0, repIndex: 0 };
  else if (stage === "stage_3") p.stage3 = { phraseIndex: 0, roundIndex: 0 };
  else if (stage === "stage_4") p.stage4 = {};
  else p.stage5 = {};
  return p;
}

/** Apply one memorization-round submission (advances stage/progress on pass). */
export function applyMemorizeRound(
  segments: string[],
  stage: MemorizeStage,
  progress: MemorizeProgressV1,
  letterSlots: string[],
  opts?: ActiveRecallWordsOpts
): MemorizeRoundResult {
  const phraseCount = segments.length;
  if (stage === "completed" || stage === "context") {
    return {
      kind: "memorize",
      passed: false,
      accuracy: 0,
      nextStage: stage,
      nextProgress: progress,
    };
  }

  const words = activeMemorizeWords(stage, segments, progress, opts);
  if (words.length === 0) {
    return {
      kind: "memorize",
      passed: false,
      accuracy: 0,
      nextStage: stage,
      nextProgress: progress,
    };
  }
  if (letterSlots.length !== words.length) {
    return {
      kind: "memorize",
      passed: false,
      accuracy: 0,
      nextStage: stage,
      nextProgress: progress,
    };
  }

  const { accuracy, passed } = scoreSlotsAgainstWords(words, letterSlots, "strict90");

  if (!passed) {
    return {
      kind: "memorize",
      passed: false,
      accuracy,
      nextStage: stage,
      nextProgress: progress,
    };
  }

  const base: MemorizeProgressV1 = { ...defaultProgressV1(), ...progress, v: 1 };

  if (stage === "stage_2") {
    const s2 = base.stage2 ?? { stepIndex: 0, repIndex: 0 };
    const totalWordsInPassage = wordsFromPhraseSegments(segments).length;
    const reps = stage2RepsPerMicroStep(phraseCount, totalWordsInPassage);
    const nextPos = advanceStage2Progress(phraseCount, s2.stepIndex, s2.repIndex, true, reps);
    if (nextPos == null) {
      return {
        kind: "memorize",
        passed: true,
        accuracy,
        nextStage: "stage_3",
        nextProgress: { v: 1, stage3: { phraseIndex: 0, roundIndex: 0 } },
      };
    }
    return {
      kind: "memorize",
      passed: true,
      accuracy,
      nextStage: "stage_2",
      nextProgress: { ...base, stage2: nextPos },
    };
  }

  if (stage === "stage_3") {
    const s3 = base.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
    if (phraseCount <= 0) {
      return {
        kind: "memorize",
        passed: true,
        accuracy,
        nextStage: "stage_4",
        nextProgress: { v: 1, stage4: {} },
      };
    }
    if (s3.roundIndex === 0) {
      return {
        kind: "memorize",
        passed: true,
        accuracy,
        nextStage: "stage_3",
        nextProgress: {
          ...base,
          stage3: { phraseIndex: s3.phraseIndex, roundIndex: 1 },
        },
      };
    }
    const nextPhrase = s3.phraseIndex + 1;
    if (nextPhrase < phraseCount) {
      return {
        kind: "memorize",
        passed: true,
        accuracy,
        nextStage: "stage_3",
        nextProgress: {
          ...base,
          stage3: { phraseIndex: nextPhrase, roundIndex: 0 },
        },
      };
    }
    return {
      kind: "memorize",
      passed: true,
      accuracy,
      nextStage: "stage_4",
      nextProgress: { v: 1, stage4: {} },
    };
  }

  if (stage === "stage_4") {
    return {
      kind: "memorize",
      passed: true,
      accuracy,
      nextStage: "stage_5",
      nextProgress: { v: 1, stage5: {} },
    };
  }

  if (stage === "stage_5") {
    return {
      kind: "memorize",
      passed: true,
      accuracy,
      nextStage: "completed",
      nextProgress: null,
    };
  }

  return {
    kind: "memorize",
    passed: false,
    accuracy,
    nextStage: stage,
    nextProgress: progress,
  };
}

/**
 * One review typing round. Persists `review_stage` + `review_progress` via caller.
 * On fail: drops review stage per `nextReviewStageAfterResult` and resets progress for the new stage.
 * On pass: advances sub-steps inside Stage 2/3 until that ladder completes, then moves to the next review stage.
 */
export function applyReviewRound(
  segments: string[],
  reviewStage: ReviewStage | null,
  reviewProgress: unknown,
  letterSlots: string[],
  opts?: {
    reviewIntervalIndex?: number;
    scheduleOverrideDays?: number | null;
    referenceTypingToken?: string | null;
  }
): Extract<MemorizeRoundResult, { kind: "review" }> {
  const stage: ReviewStage = reviewStage ?? INITIAL_REVIEW_STAGE;
  const phraseCount = segments.length;
  const idx = Math.max(0, opts?.reviewIntervalIndex ?? 0);

  const baseProgress = parseMemorizeProgress(reviewProgress);
  const progress: MemorizeProgressV1 =
    stage === "stage_2" && baseProgress.stage2 == null
      ? { ...baseProgress, ...shellProgressForReviewStage("stage_2") }
      : stage === "stage_3" && baseProgress.stage3 == null
        ? { ...baseProgress, ...shellProgressForReviewStage("stage_3") }
        : baseProgress;

  const words = activeReviewWords(stage, segments, progress, {
    referenceTypingToken: opts?.referenceTypingToken,
  });
  if (words.length === 0 || letterSlots.length !== words.length) {
    return {
      kind: "review",
      passed: false,
      accuracy: 0,
      nextReviewStage: stage,
      nextReviewProgress: progress,
      reviewSessionComplete: false,
      nextIntervalIndex: idx,
      nextHoldAtIso: null,
    };
  }

  const { accuracy, passed } = scoreSlotsAgainstWords(words, letterSlots, "shortVerseSafe");

  if (!passed) {
    const dropped = nextReviewStageAfterResult(stage, false)!;
    return {
      kind: "review",
      passed: false,
      accuracy,
      nextReviewStage: dropped,
      nextReviewProgress: shellProgressForReviewStage(dropped),
      reviewSessionComplete: false,
      nextIntervalIndex: idx,
      nextHoldAtIso: null,
    };
  }

  const merged: MemorizeProgressV1 = { ...defaultProgressV1(), ...progress, v: 1 };

  if (stage === "stage_2") {
    const s2 = merged.stage2 ?? { stepIndex: 0, repIndex: 0 };
    const totalWordsInPassage = wordsFromPhraseSegments(segments).length;
    const reps = stage2RepsPerMicroStep(phraseCount, totalWordsInPassage);
    const nextPos = advanceStage2Progress(phraseCount, s2.stepIndex, s2.repIndex, true, reps);
    if (nextPos == null) {
      return {
        kind: "review",
        passed: true,
        accuracy,
        nextReviewStage: "stage_3",
        nextReviewProgress: { v: 1, stage3: { phraseIndex: 0, roundIndex: 0 } },
        reviewSessionComplete: false,
        nextIntervalIndex: idx,
        nextHoldAtIso: null,
      };
    }
    return {
      kind: "review",
      passed: true,
      accuracy,
      nextReviewStage: "stage_2",
      nextReviewProgress: { ...merged, stage2: nextPos },
      reviewSessionComplete: false,
      nextIntervalIndex: idx,
      nextHoldAtIso: null,
    };
  }

  if (stage === "stage_3") {
    const s3 = merged.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
    if (phraseCount <= 0) {
      return {
        kind: "review",
        passed: true,
        accuracy,
        nextReviewStage: "stage_4",
        nextReviewProgress: { v: 1, stage4: {} },
        reviewSessionComplete: false,
        nextIntervalIndex: idx,
        nextHoldAtIso: null,
      };
    }
    if (s3.roundIndex === 0) {
      return {
        kind: "review",
        passed: true,
        accuracy,
        nextReviewStage: "stage_3",
        nextReviewProgress: {
          ...merged,
          stage3: { phraseIndex: s3.phraseIndex, roundIndex: 1 },
        },
        reviewSessionComplete: false,
        nextIntervalIndex: idx,
        nextHoldAtIso: null,
      };
    }
    const nextPhrase = s3.phraseIndex + 1;
    if (nextPhrase < phraseCount) {
      return {
        kind: "review",
        passed: true,
        accuracy,
        nextReviewStage: "stage_3",
        nextReviewProgress: {
          ...merged,
          stage3: { phraseIndex: nextPhrase, roundIndex: 0 },
        },
        reviewSessionComplete: false,
        nextIntervalIndex: idx,
        nextHoldAtIso: null,
      };
    }
    return {
      kind: "review",
      passed: true,
      accuracy,
      nextReviewStage: "stage_4",
      nextReviewProgress: { v: 1, stage4: {} },
      reviewSessionComplete: false,
      nextIntervalIndex: idx,
      nextHoldAtIso: null,
    };
  }

  if (stage === "stage_4") {
    return {
      kind: "review",
      passed: true,
      accuracy,
      nextReviewStage: "stage_5",
      nextReviewProgress: { v: 1, stage5: {} },
      reviewSessionComplete: false,
      nextIntervalIndex: idx,
      nextHoldAtIso: null,
    };
  }

  if (stage === "stage_5") {
    const nextIdx = nextIntervalIndexAfterCompletedCycle(idx);
    const defaultDays = daysForReviewIntervalIndex(idx);
    const override = opts?.scheduleOverrideDays;
    const days = override != null ? override : defaultDays;
    return {
      kind: "review",
      passed: true,
      accuracy,
      nextReviewStage: INITIAL_REVIEW_STAGE,
      nextReviewProgress: shellProgressForReviewStage(INITIAL_REVIEW_STAGE),
      reviewSessionComplete: true,
      nextIntervalIndex: nextIdx,
      nextHoldAtIso: addDaysIsoFromNow(days),
    };
  }

  return {
    kind: "review",
    passed: false,
    accuracy,
    nextReviewStage: stage,
    nextReviewProgress: merged,
    reviewSessionComplete: false,
    nextIntervalIndex: idx,
    nextHoldAtIso: null,
  };
}
