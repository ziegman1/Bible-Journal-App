import { BIBLE_BOOKS, getBookById } from "@/lib/scripture/books";

/**
 * Next chapter to open after the user last completed `lastCompletedChapter` in `bookId`.
 * If nothing completed yet, start at Matthew 1 (default CHAT NT reading start).
 */
export function nextReadAfterChatSoapsComplete(
  bookId: string | null | undefined,
  lastCompletedChapter: number | null | undefined
): { bookId: string; chapter: number } {
  if (
    lastCompletedChapter == null ||
    !Number.isFinite(lastCompletedChapter) ||
    lastCompletedChapter < 1 ||
    !bookId
  ) {
    return { bookId: "matthew", chapter: 1 };
  }

  const book = getBookById(bookId);
  if (!book) {
    return { bookId: "matthew", chapter: 1 };
  }

  if (lastCompletedChapter < book.chapterCount) {
    return { bookId, chapter: lastCompletedChapter + 1 };
  }

  const idx = BIBLE_BOOKS.findIndex((b) => b.id === bookId);
  if (idx < 0 || idx >= BIBLE_BOOKS.length - 1) {
    return { bookId, chapter: book.chapterCount };
  }

  return { bookId: BIBLE_BOOKS[idx + 1]!.id, chapter: 1 };
}
