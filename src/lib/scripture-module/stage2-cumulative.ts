/**
 * Stage 2 ladder: for k phrases, sequence is
 *   P1 xR, P2 xR, (P1+P2) xR, P3 xR, (P1+P2+P3) xR, … (R = 3 by default, 2 when long-passage safeguard applies)
 * For k===1 only: P1 xR.
 */

export type Stage2MicroStep =
  | { kind: "single"; phraseIndex: number }
  | { kind: "cumulative"; endPhraseIndex: number };

const STAGE2_REPS_DEFAULT = 3;
const STAGE2_REPS_LONG = 2;

/** Many phrase lines → shorten each micro-step (same ladder, fewer repeats per step). */
const STAGE2_LONG_PHRASE_THRESHOLD = 9;
/** Long passage by word count → shorten each micro-step. */
const STAGE2_LONG_WORD_THRESHOLD = 55;

/**
 * Repetitions per Stage 2 micro-step. Default 3; for long passages only, 2.
 * Rule: use 2 reps when phraseCount >= 9 OR totalWordCount >= 55; else 3.
 */
export function stage2RepsPerMicroStep(phraseCount: number, totalWordCount: number): number {
  if (phraseCount <= 0) return STAGE2_REPS_DEFAULT;
  if (phraseCount >= STAGE2_LONG_PHRASE_THRESHOLD || totalWordCount >= STAGE2_LONG_WORD_THRESHOLD) {
    return STAGE2_REPS_LONG;
  }
  return STAGE2_REPS_DEFAULT;
}

export function stage2MicroStepCount(phraseCount: number): number {
  if (phraseCount <= 0) return 0;
  if (phraseCount === 1) return 1;
  return 2 * phraseCount - 1;
}

/** Enumerate every micro-step in order (each step is practiced N times; N from `stage2RepsPerMicroStep`). */
export function buildStage2MicroSteps(phraseCount: number): Stage2MicroStep[] {
  if (phraseCount <= 0) return [];
  const steps: Stage2MicroStep[] = [];
  steps.push({ kind: "single", phraseIndex: 0 });
  for (let p = 1; p < phraseCount; p++) {
    steps.push({ kind: "single", phraseIndex: p });
    steps.push({ kind: "cumulative", endPhraseIndex: p });
  }
  return steps;
}

/** Short label for progress UI (e.g. "Phrase 2" or "Phrases 1–3"). */
export function describeStage2MicroStep(step: Stage2MicroStep): string {
  if (step.kind === "single") {
    return `Phrase ${step.phraseIndex + 1}`;
  }
  return `Phrases 1–${step.endPhraseIndex + 1}`;
}

/** Phrase segments to show for the current micro-step (for UI / word builders). */
export function segmentsForStage2MicroStep(segments: string[], step: Stage2MicroStep): string[] {
  if (segments.length === 0) return [];
  if (step.kind === "single") {
    const s = segments[step.phraseIndex];
    return s != null && String(s).trim() ? [s] : [];
  }
  return segments.slice(0, step.endPhraseIndex + 1);
}

/** Advance (stepIndex, repIndex); returns null when Stage 2 is fully complete. */
export function advanceStage2Progress(
  phraseCount: number,
  stepIndex: number,
  repIndex: number,
  roundPassed: boolean,
  repsPerMicroStep: number = STAGE2_REPS_DEFAULT
): { stepIndex: number; repIndex: number } | null {
  if (!roundPassed) return { stepIndex, repIndex };
  const totalSteps = stage2MicroStepCount(phraseCount);
  if (totalSteps === 0) return null;
  const reps = Math.max(1, Math.floor(repsPerMicroStep));
  let nextRep = repIndex + 1;
  let nextStep = stepIndex;
  if (nextRep >= reps) {
    nextRep = 0;
    nextStep += 1;
  }
  if (nextStep >= totalSteps) return null;
  return { stepIndex: nextStep, repIndex: nextRep };
}
