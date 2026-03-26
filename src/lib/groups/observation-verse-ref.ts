/**
 * Short verse reference for Look Up observations (same book/chapter as meeting passage).
 */
export function formatObservationVerseRef(opts: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number | null;
}): string {
  const { book, chapter, verseStart, verseEnd } = opts;
  const base = `${book} ${chapter}`;
  if (verseEnd != null && verseEnd !== verseStart) {
    return `${base}:${verseStart}–${verseEnd}`;
  }
  return `${base}:${verseStart}`;
}

/** Compact label when book/chapter are implied by context (e.g. under Look Up). */
export function formatObservationVerseRefShort(
  verseStart: number | null | undefined,
  verseEnd?: number | null
): string | null {
  if (verseStart == null || !Number.isFinite(Number(verseStart))) {
    return null;
  }
  const s = Number(verseStart);
  if (verseEnd != null && verseEnd !== s && Number.isFinite(Number(verseEnd))) {
    return `vv. ${s}–${verseEnd}`;
  }
  return `v. ${s}`;
}
