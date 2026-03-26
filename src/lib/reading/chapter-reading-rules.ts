import type { Chapter } from "@/lib/scripture/types";

/** Typical silent reading speed for estimating minimum time on chapter (words per minute). */
export const READING_WPM = 200;

/** Floor so very short chapters still require a deliberate pause. */
export const MIN_CHAPTER_READ_MS = 15_000;

/** IntersectionObserver root margin below viewport bottom (px) to count as “reached the end”. */
export const SCROLL_BOTTOM_ROOT_MARGIN_PX = 64;

export function countChapterWords(chapter: Chapter): number {
  if (!chapter.verses.length) return 0;
  let n = 0;
  for (const v of chapter.verses) {
    const parts = v.text.trim().split(/\s+/).filter(Boolean);
    n += parts.length;
  }
  return Math.max(n, 1);
}

/** Minimum time (ms) the tab should be visible while on this chapter before recording a read. */
export function minVisibleReadMsForChapter(wordCount: number): number {
  const fromWpm = Math.ceil((wordCount / READING_WPM) * 60_000);
  return Math.max(MIN_CHAPTER_READ_MS, fromWpm);
}
