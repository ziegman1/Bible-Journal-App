/**
 * Split verse text into thought units (fallback / display helpers).
 * Punctuation-aware first; if few segments, split long chunks by word count.
 */

/** Split after sentence/clause punctuation (deterministic). */
const SPLIT_RE = /(?<=[.!?;:])\s+|\n+/;

function chunkWords(text: string, maxWords: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    out.push(words.slice(i, i + maxWords).join(" "));
  }
  return out;
}

export function segmentVerseIntoPhrases(verseText: string): string[] {
  const raw = verseText.trim();
  if (!raw) return [];

  const byPunct = raw
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (byPunct.length >= 2) {
    return byPunct.flatMap((segment) => {
      const w = segment.split(/\s+/).filter(Boolean).length;
      if (w > 14) return chunkWords(segment, 7);
      return [segment];
    });
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length <= 8) return [raw];

  return chunkWords(raw, Math.min(8, Math.ceil(words.length / 3)));
}
