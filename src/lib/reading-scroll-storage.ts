/** Persist scroll position in the Bible reader (per book + chapter, this device only). */

const PREFIX = "bj:readerScroll:v1";

export function readerScrollStorageKey(bookId: string, chapter: number): string {
  return `${PREFIX}:${bookId}:${chapter}`;
}

export function readStoredScrollY(bookId: string, chapter: number): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(readerScrollStorageKey(bookId, chapter));
    if (!raw) return null;
    const p = JSON.parse(raw) as { y?: number };
    return typeof p.y === "number" && Number.isFinite(p.y) && p.y >= 0 ? p.y : null;
  } catch {
    return null;
  }
}

export function writeStoredScrollY(bookId: string, chapter: number, y: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      readerScrollStorageKey(bookId, chapter),
      JSON.stringify({ y: Math.round(y), t: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}
