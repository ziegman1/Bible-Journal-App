import { BIBLE_BOOKS, getBookById } from "@/lib/scripture/books";

export type ChatReadingPaceInput = {
  readingStartDateYmd: string;
  chaptersPerDay: number;
  planStartBookId: string;
  planStartChapter: number;
  /** Last completed chapter in SOAPS bookmark flow; omit or null if none. */
  bookmarkBookId: string | null | undefined;
  bookmarkLastCompletedChapter: number | null | undefined;
  /** Defaults to now (UTC calendar day). */
  asOf?: Date;
};

export type ChatReadingPaceResult = {
  daysElapsed: number;
  expectedChapters: number;
  actualChapters: number;
  delta: number;
  /** Semicircle gauge: 45° = max behind, 90° = on pace, 135° = max ahead. */
  needleDegrees: number;
  status: "ahead" | "on_pace" | "behind";
  message: string;
};

export function utcTodayYmd(asOf: Date = new Date()): string {
  const y = asOf.getUTCFullYear();
  const m = String(asOf.getUTCMonth() + 1).padStart(2, "0");
  const d = String(asOf.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Inclusive calendar days from start (UTC) through `asOf` (UTC). Future start dates yield 0 elapsed days. */
export function utcCalendarDaysElapsedInclusive(startYmd: string, asOf: Date = new Date()): number {
  const parts = startYmd.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return 0;
  const [ys, ms, ds] = parts;
  const startUtc = Date.UTC(ys!, ms! - 1, ds!);
  const endUtc = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  const diff = Math.floor((endUtc - startUtc) / 86400000);
  if (diff < 0) return 0;
  return diff + 1;
}

/**
 * Count of chapters completed from plan start through the inclusive last-completed bookmark,
 * in Protestant canonical order. Returns 0 if the bookmark is before the plan start.
 */
export function countChaptersThroughInclusiveBookmark(
  planStartBookId: string,
  planStartChapter: number,
  bookmarkBookId: string,
  bookmarkLastCompletedChapter: number
): number {
  const startBook = getBookById(planStartBookId);
  const endBook = getBookById(bookmarkBookId);
  if (!startBook || !endBook) return 0;
  const startIdx = BIBLE_BOOKS.findIndex((b) => b.id === planStartBookId);
  const endIdx = BIBLE_BOOKS.findIndex((b) => b.id === bookmarkBookId);
  if (startIdx < 0 || endIdx < 0) return 0;

  const startCh = Math.min(Math.max(1, planStartChapter), startBook.chapterCount);
  const endCh = Math.min(Math.max(1, bookmarkLastCompletedChapter), endBook.chapterCount);

  if (endIdx < startIdx) return 0;
  if (endIdx === startIdx) {
    if (endCh < startCh) return 0;
    return endCh - startCh + 1;
  }

  let total = startBook.chapterCount - startCh + 1;
  for (let i = startIdx + 1; i < endIdx; i++) {
    total += BIBLE_BOOKS[i]!.chapterCount;
  }
  total += endCh;
  return total;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function chapterWord(n: number): string {
  return n === 1 ? "chapter" : "chapters";
}

export function computeChatReadingPace(input: ChatReadingPaceInput): ChatReadingPaceResult {
  const asOf = input.asOf ?? new Date();
  const daysElapsed = utcCalendarDaysElapsedInclusive(input.readingStartDateYmd, asOf);
  const cpd = Math.min(15, Math.max(1, Math.floor(input.chaptersPerDay)));
  const expectedChapters = daysElapsed * cpd;

  let actualChapters = 0;
  if (
    input.bookmarkBookId &&
    input.bookmarkLastCompletedChapter != null &&
    Number.isFinite(input.bookmarkLastCompletedChapter) &&
    input.bookmarkLastCompletedChapter >= 1
  ) {
    actualChapters = countChaptersThroughInclusiveBookmark(
      input.planStartBookId,
      input.planStartChapter,
      input.bookmarkBookId.trim(),
      Math.floor(input.bookmarkLastCompletedChapter)
    );
  }

  const delta = actualChapters - expectedChapters;

  let status: ChatReadingPaceResult["status"];
  if (delta > 0) status = "ahead";
  else if (delta < 0) status = "behind";
  else status = "on_pace";

  const needleDegrees = clamp(90 + delta * 5, 45, 135);

  let message: string;
  if (status === "on_pace") {
    message = "You are on pace with your group's reading plan.";
  } else if (status === "ahead") {
    message = `You are ${delta} ${chapterWord(delta)} ahead of pace.`;
  } else {
    message = `You are ${Math.abs(delta)} ${chapterWord(Math.abs(delta))} behind pace.`;
  }

  return {
    daysElapsed,
    expectedChapters,
    actualChapters,
    delta,
    needleDegrees,
    status,
    message,
  };
}
