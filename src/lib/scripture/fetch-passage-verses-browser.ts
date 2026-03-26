"use client";

import { createClient } from "@/lib/supabase/client";
import { getBookByName } from "@/lib/scripture/books";

const DEFAULT_TRANSLATION = "web";

function toBookId(book: string): string {
  return book.toLowerCase().replace(/\s+/g, "");
}

/**
 * Load WEB verses for a chapter from the browser (Supabase client).
 * Used when the meeting page SSR returned an empty verse list (e.g. env/cache) so Look Up can still show text.
 */
export async function fetchPassageVersesRangeInBrowser(opts: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}): Promise<{ verse: number; text: string }[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const bookId = getBookByName(opts.book)?.id ?? toBookId(opts.book);

  const { data: bookRow } = await supabase
    .from("scripture_books")
    .select("id, name")
    .eq("id", bookId)
    .maybeSingle();

  if (!bookRow) return [];

  const { data: verses, error } = await supabase
    .from("scripture_verses")
    .select("verse_number, text")
    .eq("book_id", bookId)
    .eq("chapter_number", opts.chapter)
    .eq("translation", DEFAULT_TRANSLATION)
    .gte("verse_number", opts.verseStart)
    .lte("verse_number", opts.verseEnd)
    .order("verse_number", { ascending: true });

  if (error || !verses?.length) return [];

  return verses.map((v) => ({
    verse: v.verse_number,
    text: v.text,
  }));
}
