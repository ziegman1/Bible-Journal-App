import { startOfWeek } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { BIBLE_BOOKS, getBookById } from "@/lib/scripture/books";

export type ChatReadingPaceInput = {
  readingStartDateYmd: string;
  chaptersPerDay: number;
  planStartBookId: string;
  planStartChapter: number;
  /**
   * Chapters from plan start through the slowest partner who has CHAT SOAPS progress
   * (min over members with a bookmark). Pace compares this to the calendar, not the viewer’s
   * personal furthest chapter—so meeting a partner “where they are” does not mark the pair behind.
   */
  pairProgressChaptersFromPlan: number;
  /** IANA zone: “today” and elapsed-day count match BADWR practice rhythm (device cookie on web). */
  practiceTimeZone: string;
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

/** @deprecated Prefer {@link practiceTodayYmd} for BADWR-visible defaults; kept for rare UTC-only callers. */
export function utcTodayYmd(asOf: Date = new Date()): string {
  const y = asOf.getUTCFullYear();
  const m = String(asOf.getUTCMonth() + 1).padStart(2, "0");
  const d = String(asOf.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function practiceTodayYmd(asOf: Date, timeZone: string): string {
  return formatInTimeZone(asOf, timeZone, "yyyy-MM-dd");
}

/** Sunday start of the practice week containing `asOf`, as yyyy-MM-dd in `timeZone`. */
export function practiceWeekStartSundayYmd(asOf: Date, timeZone: string): string {
  const zoned = toZonedTime(asOf, timeZone);
  const sunday = startOfWeek(zoned, { weekStartsOn: 0 });
  return formatInTimeZone(sunday, timeZone, "yyyy-MM-dd");
}

/**
 * Inclusive calendar days from `startYmd` through `asOf`’s calendar date in `timeZone`.
 * Future start dates yield 0 elapsed days.
 */
export function practiceCalendarDaysElapsedInclusive(
  startYmd: string,
  asOf: Date,
  timeZone: string
): number {
  const parts = startYmd.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return 0;
  const [ys, ms, ds] = parts;
  const startUtc = Date.UTC(ys!, ms! - 1, ds!);
  const endYmd = formatInTimeZone(asOf, timeZone, "yyyy-MM-dd");
  const [ye, me, de] = endYmd.split("-").map(Number);
  const endUtc = Date.UTC(ye!, me! - 1, de!);
  const diff = Math.floor((endUtc - startUtc) / 86400000);
  if (diff < 0) return 0;
  return diff + 1;
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

/**
 * Among members who have saved CHAT SOAPS progress, the minimum chapters completed from
 * plan start (canonical order). Members with no row are ignored so new joiners do not zero the pair.
 */
export function pairMinChaptersFromPlan(
  planStartBookId: string,
  planStartChapter: number,
  progressRows: readonly { book_id: string; last_completed_chapter: number }[]
): number {
  if (progressRows.length === 0) return 0;
  let minIdx = Infinity;
  for (const row of progressRows) {
    const idx = countChaptersThroughInclusiveBookmark(
      planStartBookId,
      planStartChapter,
      row.book_id.trim(),
      row.last_completed_chapter
    );
    minIdx = Math.min(minIdx, idx);
  }
  return minIdx === Infinity ? 0 : minIdx;
}

/**
 * 1-based ordinal along the plan: first chapter of the plan (plan_start_book_id / plan_start_chapter) is 1.
 */
export function bookChapterAtOrdinalFromPlan(
  planStartBookId: string,
  planStartChapter: number,
  ordinal: number
): { book_id: string; chapter: number } | null {
  if (ordinal < 1) return null;
  const startIdx = BIBLE_BOOKS.findIndex((b) => b.id === planStartBookId);
  if (startIdx < 0) return null;
  let remaining = ordinal;
  let bi = startIdx;
  const startBook = BIBLE_BOOKS[bi]!;
  let ch = Math.min(Math.max(1, planStartChapter), startBook.chapterCount);
  while (bi < BIBLE_BOOKS.length) {
    const book = BIBLE_BOOKS[bi]!;
    const chaptersFromCurrent = book.chapterCount - ch + 1;
    if (remaining <= chaptersFromCurrent) {
      return { book_id: book.id, chapter: ch + remaining - 1 };
    }
    remaining -= chaptersFromCurrent;
    bi++;
    ch = 1;
  }
  return null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function chapterWord(n: number): string {
  return n === 1 ? "chapter" : "chapters";
}

export function computeChatReadingPace(input: ChatReadingPaceInput): ChatReadingPaceResult {
  const asOf = input.asOf ?? new Date();
  const daysElapsed = practiceCalendarDaysElapsedInclusive(
    input.readingStartDateYmd,
    asOf,
    input.practiceTimeZone
  );
  const cpd = Math.min(15, Math.max(1, Math.floor(input.chaptersPerDay)));
  const expectedChapters = daysElapsed * cpd;

  const actualChapters = Math.max(
    0,
    Math.floor(Number.isFinite(input.pairProgressChaptersFromPlan) ? input.pairProgressChaptersFromPlan : 0)
  );

  const delta = actualChapters - expectedChapters;

  let status: ChatReadingPaceResult["status"];
  if (delta > 0) status = "ahead";
  else if (delta < 0) status = "behind";
  else status = "on_pace";

  const needleDegrees = clamp(90 + delta * 5, 45, 135);

  let message: string;
  if (status === "on_pace") {
    message = "Your CHAT pair is on pace with the shared reading schedule.";
  } else if (status === "ahead") {
    message = `Your CHAT pair is ${delta} ${chapterWord(delta)} ahead of the shared schedule.`;
  } else {
    message = `Your CHAT pair is ${Math.abs(delta)} ${chapterWord(Math.abs(delta))} behind the shared schedule.`;
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
