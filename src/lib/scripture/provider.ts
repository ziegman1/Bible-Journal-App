import { getBookById } from "./books";
import { getMockChapter } from "./mock-data";
import type { Chapter, ScriptureReference } from "./types";
import { formatReference } from "./types";

/**
 * Scripture Provider - Abstraction layer for Bible text.
 * Replace the implementation with a licensed Bible API when available.
 * All consumers should use this provider, not mock-data directly.
 */

export async function getChapter(bookId: string, chapterNum: number): Promise<Chapter | null> {
  const book = getBookById(bookId);
  if (!book) return null;

  if (chapterNum < 1 || chapterNum > book.chapterCount) {
    return null;
  }

  const chapter = getMockChapter(bookId, book.name, chapterNum);
  return chapter;
}

export function formatPassageReference(ref: ScriptureReference): string {
  return formatReference(ref);
}
