import {
  expectedFirstLetterString,
  firstLetterFromWord,
  parseUserFirstLetterSequence,
  wordsFromPhraseSegments,
} from "@/lib/scripture-module/memorize-words";

/** Minimum similarity (1 − normalized edit distance) required to pass a typing round. */
export const MEMORIZE_TYPING_PASS_THRESHOLD = 0.9;

/**
 * Builds the actual letter string from one user input per word (same order as `words`).
 * Skips words with no expected first letter (punctuation-only tokens), matching `expectedFirstLetterString`.
 * Empty or invalid slot contributes a space so length stays aligned with expected.
 */
export function buildActualFromWordSlots(words: string[], slots: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const ew = firstLetterFromWord(words[i]);
    if (!ew) continue;
    const got = firstLetterFromWord(slots[i] ?? "") || " ";
    parts.push(got);
  }
  return parts.join("");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[n];
}

/**
 * Scores first-letter recall by comparing the expected letter string (from phrase segments)
 * to the user input (whitespace-separated first letters).
 *
 * Similarity = 1 − Levenshtein(expected, actual) / max(len(expected), len(actual), 1).
 * This yields typo tolerance: a few edits on longer passages stay above 90%.
 *
 * Pass `userRawInput` as a string (legacy whitespace-separated) or as one string per word (preferred).
 */
export function scoreFirstLetterTypingRound(
  phraseSegments: string[],
  userRawInput: string | string[]
): {
  passed: boolean;
  accuracy: number;
  expected: string;
  actual: string;
  editDistance: number;
} {
  const words = wordsFromPhraseSegments(phraseSegments);
  const expected = expectedFirstLetterString(words);
  const actual = Array.isArray(userRawInput)
    ? buildActualFromWordSlots(words, userRawInput)
    : parseUserFirstLetterSequence(userRawInput);
  const maxLen = Math.max(expected.length, actual.length, 1);
  const editDistance = levenshtein(expected, actual);
  const accuracy = 1 - editDistance / maxLen;
  const passed = accuracy >= MEMORIZE_TYPING_PASS_THRESHOLD;
  return { passed, accuracy, expected, actual, editDistance };
}

/** For UI: expected letters as space-separated single characters (readability). */
export function expectedLettersSpaced(phraseSegments: string[]): string {
  const words = wordsFromPhraseSegments(phraseSegments);
  return words.map(firstLetterFromWord).filter(Boolean).join(" ");
}
