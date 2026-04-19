/** Word order for memorization scoring: user phrase segments in order, words within each phrase. */

export function wordsFromPhraseSegments(segments: string[]): string[] {
  const out: string[] = [];
  for (const seg of segments) {
    for (const w of seg.trim().split(/\s+/).filter(Boolean)) {
      out.push(w);
    }
  }
  return out;
}

/** First alphanumeric character of a word, lowercased (matches first-letter prompts). */
export function firstLetterFromWord(word: string): string {
  const m = word.match(/[A-Za-z0-9]/);
  return m ? m[0].toLowerCase() : "";
}

export function expectedFirstLetterString(words: string[]): string {
  return words.map(firstLetterFromWord).filter(Boolean).join("");
}

/** User-typed recall: whitespace-separated tokens; first letter per token; non-letters stripped. */
export function parseUserFirstLetterSequence(raw: string): string {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const letters: string[] = [];
  for (const p of parts) {
    const L = firstLetterFromWord(p);
    if (L) letters.push(L);
  }
  return letters.join("");
}
