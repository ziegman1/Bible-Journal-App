/**
 * Deterministic word visibility for memorization stages 3–5.
 * Words are indexed 0..n-1 in passage order (from phrase segments).
 */

/** Stage 3 round 0: hide 1-based odd word positions → 0-based indices 0,2,4,… */
export function stage3HiddenWordIndices(roundIndex: 0 | 1, wordCount: number): Set<number> {
  const hidden = new Set<number>();
  for (let i = 0; i < wordCount; i++) {
    const oneBased = i + 1;
    if (roundIndex === 0) {
      if (oneBased % 2 === 1) hidden.add(i);
    } else {
      if (oneBased % 2 === 0) hidden.add(i);
    }
  }
  return hidden;
}

/**
 * Stage 4: whole passage; hide every other word using 0-based parity.
 * Passage starts visible at even indices (0,2,4,…) and hidden at odd (1,3,5,…).
 * (Alternating pattern; tie-break documented for reproducibility.)
 */
export function stage4HiddenWordIndices(wordCount: number): Set<number> {
  const hidden = new Set<number>();
  for (let i = 0; i < wordCount; i++) {
    if (i % 2 === 1) hidden.add(i);
  }
  return hidden;
}

/** Stage 5: all words hidden until answered (every index hidden for display). */
export function stage5AllHidden(wordCount: number): Set<number> {
  return new Set(Array.from({ length: wordCount }, (_, i) => i));
}
