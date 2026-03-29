"use server";

import { getChapter, sliceChapterByVerseRange } from "@/lib/scripture/web";

/**
 * Load WEB verses for a passage range (server). Same data path as the reader;
 * avoids browser-side Supabase queries (blocked trackers, env edge cases).
 */
export async function fetchPassageVersesRangeAction(opts: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}): Promise<{ verse: number; text: string }[]> {
  const book = opts.book.trim();
  if (!book) return [];

  const chapterData = await getChapter(book, opts.chapter);
  if (!chapterData) return [];

  return sliceChapterByVerseRange(chapterData, opts.verseStart, opts.verseEnd);
}
