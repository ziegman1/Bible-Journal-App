/** First letter of each word (letters only), space-separated — for recall prompts. */

function firstLetterToken(word: string): string {
  const m = word.match(/[A-Za-z0-9]/);
  return m ? m[0].toUpperCase() : "";
}

export function firstLettersForPhrase(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(firstLetterToken)
    .filter(Boolean)
    .join(" ");
}

export function firstLettersForVerse(verseText: string): string {
  return firstLettersForPhrase(verseText);
}

/** Opening “strong start”: first 3–5 words of the verse. */
export function openingPhraseWords(verseText: string, maxWords = 5): string {
  const words = verseText.trim().split(/\s+/).filter(Boolean);
  const n = Math.min(Math.max(3, Math.min(5, words.length)), words.length);
  return words.slice(0, n).join(" ");
}
