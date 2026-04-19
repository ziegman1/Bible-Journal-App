export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Per-word visibility for the supported recall round. Deterministic from `seed`;
 * change `seed` (e.g. retry counter) to reshuffle which words stay visible.
 * ~50% of words visible on average (tunable threshold).
 */
export function visibleWordMask(wordCount: number, seed: string): boolean[] {
  if (wordCount <= 0) return [];
  const rng = mulberry32(hashSeed(seed));
  const mask: boolean[] = [];
  for (let i = 0; i < wordCount; i++) {
    mask.push(rng() < 0.5);
  }
  if (wordCount > 2 && mask.every((v) => v)) mask[wordCount - 1] = false;
  if (wordCount > 2 && mask.every((v) => !v)) mask[0] = true;
  return mask;
}

export type PhraseWordSlot = {
  phraseIndex: number;
  wordInPhrase: number;
  word: string;
  globalWordIndex: number;
};

export function buildPhraseWordSlots(segments: string[]): PhraseWordSlot[] {
  const slots: PhraseWordSlot[] = [];
  let globalWordIndex = 0;
  segments.forEach((phrase, phraseIndex) => {
    const words = phrase.trim().split(/\s+/).filter(Boolean);
    words.forEach((word, wordInPhrase) => {
      slots.push({ phraseIndex, wordInPhrase, word, globalWordIndex });
      globalWordIndex += 1;
    });
  });
  return slots;
}

/** Virtual phrase rows for reference token characters (prefix / suffix around passage). */
export const REF_PHRASE_PREFIX = -10;
export const REF_PHRASE_SUFFIX = -11;

/**
 * Whole-passage recall (stages 4–5): optional reference typing token before and after passage words.
 * Each character of `referenceToken` is one slot (same typing/scoring as one “word” whose expected
 * character is that slot). Passage slots keep phrase indices 0..n-1; `globalWordIndex` is contiguous.
 *
 * **Display:** The UI shows the saved scripture reference string (e.g. `Romans 10:9`) for the prefix/suffix
 * blocks, not the compact `referenceToken`. Scoring and `slot.word` remain token characters.
 */
export function buildRecallWordSlots(
  segments: string[],
  referenceToken: string,
  includeReference: boolean
): PhraseWordSlot[] {
  const body = buildPhraseWordSlots(segments);
  const tok = includeReference ? referenceToken.trim() : "";
  if (!tok) {
    return body;
  }
  const chars = [...tok];
  const prefixLen = chars.length;
  const bodyLen = body.length;
  const slots: PhraseWordSlot[] = [];

  chars.forEach((ch, i) => {
    slots.push({
      phraseIndex: REF_PHRASE_PREFIX,
      wordInPhrase: i,
      word: ch,
      globalWordIndex: i,
    });
  });

  for (const slot of body) {
    slots.push({
      ...slot,
      globalWordIndex: prefixLen + slot.globalWordIndex,
    });
  }

  chars.forEach((ch, i) => {
    slots.push({
      phraseIndex: REF_PHRASE_SUFFIX,
      wordInPhrase: i,
      word: ch,
      globalWordIndex: prefixLen + bodyLen + i,
    });
  });

  return slots;
}
