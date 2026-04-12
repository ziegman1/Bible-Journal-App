import { BIBLE_BOOKS } from "@/lib/scripture/books";

/** User-facing hint when parsing fails or the field is invalid. */
export const SOLO_SCRIPTURE_REF_HINT =
  "Enter a passage like Matthew 13:1-58";

export type SoloParsedScriptureRef =
  | {
      ok: true;
      /** Canonical WEB book name (matches `BIBLE_BOOKS.name`). */
      book: string;
      chapter: number;
      verseStart: number;
      verseEnd: number;
    }
  | { ok: false; message: string };

function normalizeSpaces(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Whole-chapter upper bound; `sliceChapterByVerseRange` only returns existing verses. */
const WHOLE_CHAPTER_VERSE_END = 9999;

/**
 * Parse a free-typed reference into book + chapter + verse range for WEB loading.
 *
 * Supported shapes (examples):
 * - `Matthew 13:1-58`, `Exodus 19:4-6`, `1 Peter 2:9-12` — chapter:verse-verse
 * - `John 3:16` — single verse
 * - `Psalm 23`, `Psalms 23`, `Psalm 23:1-6` — Psalms; chapter-only loads whole chapter
 */
export function parseSoloScriptureReference(raw: string): SoloParsedScriptureRef {
  const input = normalizeSpaces(raw);
  if (!input) {
    return { ok: false, message: SOLO_SCRIPTURE_REF_HINT };
  }

  const lower = input.toLowerCase();
  const booksLongestFirst = [...BIBLE_BOOKS].sort((a, b) => b.name.length - a.name.length);

  let bookName: string | null = null;
  let remainder = "";

  if (lower.startsWith("psalm ")) {
    bookName = "Psalms";
    remainder = input.slice(6).trim();
  } else {
    for (const b of booksLongestFirst) {
      const bn = b.name;
      if (lower.length < bn.length) continue;
      if (!lower.startsWith(bn.toLowerCase())) continue;
      if (input.length > bn.length) {
        const after = input[bn.length];
        if (after !== undefined && after !== " ") {
          continue;
        }
      }
      bookName = b.name;
      remainder = input.slice(bn.length).trim();
      break;
    }
  }

  if (!bookName) {
    return { ok: false, message: "Could not recognize a Bible book name. " + SOLO_SCRIPTURE_REF_HINT };
  }

  const meta = BIBLE_BOOKS.find((b) => b.name === bookName);
  if (!meta) {
    return { ok: false, message: SOLO_SCRIPTURE_REF_HINT };
  }

  if (!remainder) {
    return { ok: false, message: "Add chapter and verses, e.g. " + SOLO_SCRIPTURE_REF_HINT };
  }

  const loc = parseLocation(remainder);
  if (!loc) {
    return { ok: false, message: SOLO_SCRIPTURE_REF_HINT };
  }

  if (loc.chapter < 1 || loc.chapter > meta.chapterCount) {
    return {
      ok: false,
      message: `${bookName} has no chapter ${loc.chapter}.`,
    };
  }

  const verseStart = loc.verseStart;
  const verseEnd = loc.verseEnd;
  if (verseEnd !== WHOLE_CHAPTER_VERSE_END && (verseStart < 1 || verseEnd < 1)) {
    return { ok: false, message: SOLO_SCRIPTURE_REF_HINT };
  }

  if (verseEnd !== WHOLE_CHAPTER_VERSE_END && verseStart > verseEnd) {
    return { ok: true, book: bookName, chapter: loc.chapter, verseStart: verseEnd, verseEnd: verseStart };
  }

  return { ok: true, book: bookName, chapter: loc.chapter, verseStart, verseEnd };
}

function parseLocation(remainder: string):
  | { chapter: number; verseStart: number; verseEnd: number }
  | null {
  const r = remainder.trim();

  const range = r.match(/^(\d+)\s*:\s*(\d+)\s*[-–—]\s*(\d+)\s*$/);
  if (range) {
    const chapter = parseInt(range[1], 10);
    const a = parseInt(range[2], 10);
    const b = parseInt(range[3], 10);
    if (![chapter, a, b].every((n) => Number.isFinite(n))) return null;
    return { chapter, verseStart: a, verseEnd: b };
  }

  const single = r.match(/^(\d+)\s*:\s*(\d+)\s*$/);
  if (single) {
    const chapter = parseInt(single[1], 10);
    const v = parseInt(single[2], 10);
    if (![chapter, v].every((n) => Number.isFinite(n))) return null;
    return { chapter, verseStart: v, verseEnd: v };
  }

  const chapterOnly = r.match(/^(\d+)\s*$/);
  if (chapterOnly) {
    const chapter = parseInt(chapterOnly[1], 10);
    if (!Number.isFinite(chapter)) return null;
    return {
      chapter,
      verseStart: 1,
      verseEnd: WHOLE_CHAPTER_VERSE_END,
    };
  }

  return null;
}
