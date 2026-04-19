/**
 * Word-level first-letter scoring for stage-based memorization.
 * Uses the same fat-finger grace as memorize-recall-grace (re-exported).
 */

import { firstLetterMatchesWithGrace } from "@/lib/scripture-module/memorize-recall-grace";
import { firstLetterFromWord } from "@/lib/scripture-module/memorize-words";

export const MEMORIZE_PASS_ACCURACY = 0.9;

/**
 * Short-verse safeguard (optional; not used for primary memorize pass — see `scoreRoundFromWordBooleans`).
 */
export function roundPassesForWordRound(accuracy: number, totalWords: number, correctWords: number): boolean {
  if (totalWords <= 0) return false;
  if (totalWords >= 6) {
    return accuracy >= MEMORIZE_PASS_ACCURACY;
  }
  if (totalWords >= 3) {
    return correctWords >= totalWords - 1;
  }
  return correctWords === totalWords;
}

export { firstLetterMatchesWithGrace };

/** Whether a single word’s first-letter attempt is accepted (includes typo grace). */
export function scoreWordFirstLetter(word: string, typed: string): boolean {
  return firstLetterMatchesWithGrace(word, typed);
}

/**
 * Accuracy over the whole passage from per-word correctness (after grace).
 * accuracy = correctWords / totalWords. Pass if accuracy >= MEMORIZE_PASS_ACCURACY.
 */
export function accuracyFromWordResults(correctCount: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  return correctCount / totalWords;
}

export function roundPasses(accuracy: number): boolean {
  return accuracy >= MEMORIZE_PASS_ACCURACY;
}

export type WordRoundPassRule = "strict90" | "shortVerseSafe";

/**
 * Aggregate scoring from parallel arrays (same length as words).
 * Each boolean is first-try correctness per word.
 * wrongAttempts: count of wrong keystrokes (optional; if omitted, derived from booleans).
 */
export function scoreRoundFromWordBooleans(
  results: boolean[],
  wrongAttempts?: number,
  passRule: WordRoundPassRule = "shortVerseSafe"
): { accuracy: number; passed: boolean; totalWords: number; correctWords: number; wrongAttempts: number } {
  const totalWords = results.length;
  const correctWords = results.filter(Boolean).length;
  const wa =
    wrongAttempts !== undefined
      ? wrongAttempts
      : totalWords - correctWords;
  const accuracy = totalWords > 0 ? correctWords / totalWords : 0;
  const passed =
    passRule === "strict90"
      ? roundPasses(accuracy)
      : roundPassesForWordRound(accuracy, totalWords, correctWords);
  return { accuracy, passed, totalWords, correctWords, wrongAttempts: wa };
}

/** Build expected first-letter string for sanity checks (aligned with memorize-words). */
export function expectedLettersFromWords(words: string[]): string {
  return words.map(firstLetterFromWord).filter(Boolean).join("");
}
