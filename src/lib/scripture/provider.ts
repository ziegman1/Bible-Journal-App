import { getBookById } from "./books";
import { getChapter as getWebChapter } from "./web";
import { getMockChapter } from "./mock-data";
import type { Chapter, ScriptureReference } from "./types";
import { formatReference } from "./types";

/**
 * Scripture Provider - Fetches from Supabase (WEB) with mock fallback.
 * All consumers should use this provider.
 */

export async function getChapter(bookId: string, chapterNum: number): Promise<Chapter | null> {
  const book = getBookById(bookId);
  if (!book) return null;

  if (chapterNum < 1 || chapterNum > book.chapterCount) {
    return null;
  }

  const chapter = await getWebChapter(book.name, chapterNum);
  if (chapter) return chapter;

  return getMockChapter(bookId, book.name, chapterNum);
}

export function formatPassageReference(ref: ScriptureReference): string {
  return formatReference(ref);
}
