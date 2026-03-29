import { createClient } from "@/lib/supabase/server";
import { getBookByName } from "./books";
import type { Chapter, Verse } from "./types";

const DEFAULT_TRANSLATION = "web";

/**
 * Scripture service - fetches World English Bible (WEB) from Supabase.
 * Supports future translations via the translation column.
 */

function toBookId(book: string): string {
  return book.toLowerCase().replace(/\s+/g, "");
}

export async function getChapter(
  book: string,
  chapter: number,
  translation: string = DEFAULT_TRANSLATION
): Promise<Chapter | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const bookId = getBookByName(book)?.id ?? toBookId(book);
  const { data: bookRow } = await supabase
    .from("scripture_books")
    .select("id, name")
    .eq("id", bookId)
    .single();

  if (!bookRow) return null;

  const { data: verses, error } = await supabase
    .from("scripture_verses")
    .select("verse_number, text")
    .eq("book_id", bookId)
    .eq("chapter_number", chapter)
    .eq("translation", translation)
    .order("verse_number", { ascending: true });

  if (error || !verses?.length) return null;

  const chapterData: Chapter = {
    book: bookRow.name,
    bookId: bookRow.id,
    chapter,
    verses: verses.map((v) => ({
      verse: v.verse_number,
      text: v.text,
    })),
  };

  return chapterData;
}

/** Verses in inclusive range; if start > end, bounds are swapped. */
export function sliceChapterByVerseRange(
  chapter: Chapter,
  verseStart: number,
  verseEnd: number
): { verse: number; text: string }[] {
  const lo = Math.min(verseStart, verseEnd);
  const hi = Math.max(verseStart, verseEnd);
  return chapter.verses
    .filter((v) => v.verse >= lo && v.verse <= hi)
    .map((v) => ({ verse: v.verse, text: v.text }));
}

export async function getVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: string = DEFAULT_TRANSLATION
): Promise<Verse | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const bookId = getBookByName(book)?.id ?? toBookId(book);
  const { data, error } = await supabase
    .from("scripture_verses")
    .select("verse_number, text")
    .eq("book_id", bookId)
    .eq("chapter_number", chapter)
    .eq("verse_number", verse)
    .eq("translation", translation)
    .single();

  if (error || !data) return null;

  return {
    verse: data.verse_number,
    text: data.text,
  };
}

export async function getPassage(
  book: string,
  chapter: number,
  translation: string = DEFAULT_TRANSLATION
): Promise<Chapter | null> {
  return getChapter(book, chapter, translation);
}
