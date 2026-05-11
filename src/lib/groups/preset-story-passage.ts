import { getBookIdFromName } from "@/lib/scripture/books";
import { getChapter } from "@/lib/scripture/provider";
import {
  formatPassageSegmentRef,
  makePassageVerseLineId,
  parsePassageSegments,
  type PassageSegment,
  type PassageVerseLine,
  type PresetStoryPassageRow,
} from "@/lib/groups/preset-story-passage.shared";

function shortBookLabel(book: string): string {
  const b = book.trim();
  const words = b.split(/\s+/).filter(Boolean);
  if (words[0] && /^\d+$/.test(words[0]) && words[1]) {
    return `${words[0]} ${words[1].slice(0, 3)}`;
  }
  if (b === "Psalms") return "Ps";
  return (words[0] ?? b).slice(0, 4);
}

function sameBookAndChapter(a: PassageSegment, b: PassageSegment): boolean {
  return (
    a.book.trim().toLowerCase() === b.book.trim().toLowerCase() &&
    a.chapter === b.chapter
  );
}

/**
 * Loads every `passage_segments` slice (multi-chapter / multi-book when available).
 * Each segment is labeled so Look Up can show what is on-screen vs optional refs.
 *
 * Imports Supabase-backed scripture — use only from Server Components / server actions,
 * not from Client Components (import types/helpers from `preset-story-passage.shared`).
 */
export async function loadPresetStoryVerseLines(
  row: PresetStoryPassageRow
): Promise<PassageVerseLine[]> {
  const segs = parsePassageSegments(row);
  if (segs.length === 0) return [];

  const singleChapter =
    segs.length > 0 &&
    segs.every((s) => sameBookAndChapter(s, segs[0]));

  const out: PassageVerseLine[] = [];
  let segIdx = 0;
  for (const s of segs) {
    segIdx += 1;
    const bookId = getBookIdFromName(s.book);
    if (!bookId) continue;
    const ch = await getChapter(bookId, s.chapter);
    if (!ch) continue;

    const heading =
      segs.length > 1
        ? `Part ${segIdx} of ${segs.length} — ${formatPassageSegmentRef(s)}`
        : undefined;

    const rows = ch.verses
      .filter(
        (v) => v.verse >= s.verse_start && v.verse <= s.verse_end
      )
      .sort((a, b) => a.verse - b.verse);

    for (let i = 0; i < rows.length; i++) {
      const v = rows[i];
      const verseDisplayLabel = singleChapter
        ? String(v.verse)
        : `${shortBookLabel(s.book)} ${s.chapter}:${v.verse}`;
      out.push({
        verse: v.verse,
        text: v.text,
        book: s.book,
        chapter: s.chapter,
        lineId: makePassageVerseLineId(s.book, s.chapter, v.verse),
        segmentHeadingBefore: i === 0 ? heading : undefined,
        verseDisplayLabel,
      });
    }
  }
  return out;
}

/** @deprecated Prefer {@link loadPresetStoryVerseLines} for full segment metadata. */
export async function loadPresetStoryVerses(
  row: PresetStoryPassageRow
): Promise<{ verse: number; text: string }[]> {
  const lines = await loadPresetStoryVerseLines(row);
  return lines.map(({ verse, text }) => ({ verse, text }));
}
