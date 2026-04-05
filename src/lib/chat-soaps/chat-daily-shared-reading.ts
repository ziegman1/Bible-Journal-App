import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getBookById } from "@/lib/scripture/books";
import {
  bookChapterAtOrdinalFromPlan,
  countChaptersThroughInclusiveBookmark,
} from "@/lib/chat-soaps/reading-pace";

/** Chapters the pair aims to read forward together on a practice day (from shared baseline). */
export const CHAT_DAILY_FORWARD_CHAPTER_GOAL = 3;

export type ChatSoapsChapterEventRow = {
  user_id: string;
  book_id: string;
  chapter: number;
  completed_at: string;
};

export type ChatDailySharedReadingResult = {
  practiceDateYmd: string;
  goalForwardChapters: number;
  /** Inclusive chapters from plan start through shared baseline; next chapters are baseline+1 … */
  sharedBaselineOrdinal: number;
  pairMetGoalToday: boolean;
  eachMemberMet: Record<string, boolean>;
  targetSummary: string;
  accountabilityMessage: string;
};

function practiceDayBoundsUtc(ymd: string, timeZone: string): { startMs: number; endMs: number } {
  const startMs = fromZonedTime(`${ymd}T00:00:00`, timeZone).getTime();
  const nextYmd = formatInTimeZone(
    addDays(fromZonedTime(`${ymd}T00:00:00`, timeZone), 1),
    timeZone,
    "yyyy-MM-dd"
  );
  const endMs = fromZonedTime(`${nextYmd}T00:00:00`, timeZone).getTime();
  return { startMs, endMs };
}

function filterEventsInDay(
  events: ChatSoapsChapterEventRow[],
  ymd: string,
  timeZone: string
): ChatSoapsChapterEventRow[] {
  const { startMs, endMs } = practiceDayBoundsUtc(ymd, timeZone);
  return events.filter((e) => {
    const t = new Date(e.completed_at).getTime();
    return t >= startMs && t < endMs;
  });
}

function filterEventsBeforeDay(
  events: ChatSoapsChapterEventRow[],
  ymd: string,
  timeZone: string
): ChatSoapsChapterEventRow[] {
  const { startMs } = practiceDayBoundsUtc(ymd, timeZone);
  return events.filter((e) => new Date(e.completed_at).getTime() < startMs);
}

function maxOrdinalForUser(
  userId: string,
  events: ChatSoapsChapterEventRow[],
  planStartBookId: string,
  planStartChapter: number
): number {
  let maxO = 0;
  for (const e of events) {
    if (e.user_id !== userId) continue;
    const o = countChaptersThroughInclusiveBookmark(
      planStartBookId,
      planStartChapter,
      e.book_id.trim(),
      Math.floor(e.chapter)
    );
    maxO = Math.max(maxO, o);
  }
  return maxO;
}

function userInclusiveOrdinalFromBookmark(
  userId: string,
  progressRows: readonly { user_id: string; book_id: string; last_completed_chapter: number }[],
  planStartBookId: string,
  planStartChapter: number
): number {
  const row = progressRows.find((p) => p.user_id === userId);
  if (!row) return 0;
  return countChaptersThroughInclusiveBookmark(
    planStartBookId,
    planStartChapter,
    row.book_id.trim(),
    row.last_completed_chapter
  );
}

/**
 * Per-user position before the practice day: prefer max from prior events; else bookmark.
 */
function sharedBaselineFromHistory(
  memberUserIds: string[],
  eventsBeforeDay: ChatSoapsChapterEventRow[],
  progressRows: readonly { user_id: string; book_id: string; last_completed_chapter: number }[],
  planStartBookId: string,
  planStartChapter: number
): number {
  if (memberUserIds.length === 0) return 0;
  let minPos = Infinity;
  for (const uid of memberUserIds) {
    const fromEvents = maxOrdinalForUser(uid, eventsBeforeDay, planStartBookId, planStartChapter);
    const fromBookmark = userInclusiveOrdinalFromBookmark(
      uid,
      progressRows,
      planStartBookId,
      planStartChapter
    );
    const pos = fromEvents > 0 ? fromEvents : fromBookmark;
    minPos = Math.min(minPos, pos);
  }
  return minPos === Infinity ? 0 : minPos;
}

function formatTargetSummary(
  planStartBookId: string,
  planStartChapter: number,
  baselineInclusive: number,
  count: number
): string {
  const parts: string[] = [];
  for (let i = 1; i <= count; i++) {
    const pos = bookChapterAtOrdinalFromPlan(planStartBookId, planStartChapter, baselineInclusive + i);
    if (!pos) break;
    const book = getBookById(pos.book_id);
    parts.push(`${book?.name ?? pos.book_id} ${pos.chapter}`);
  }
  return parts.join(" · ");
}

function userMetOrderedForwardGoal(
  userId: string,
  eventsOnDay: ChatSoapsChapterEventRow[],
  planStartBookId: string,
  planStartChapter: number,
  baselineInclusive: number,
  goalLen: number
): boolean {
  const targets: number[] = [];
  for (let i = 1; i <= goalLen; i++) {
    targets.push(baselineInclusive + i);
  }
  const sorted = [...eventsOnDay]
    .filter((e) => e.user_id === userId)
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  let lastOrd = -Infinity;
  let ti = 0;
  for (const e of sorted) {
    const o = countChaptersThroughInclusiveBookmark(
      planStartBookId,
      planStartChapter,
      e.book_id.trim(),
      Math.floor(e.chapter)
    );
    if (o <= lastOrd) continue;
    lastOrd = o;
    if (o === targets[ti]) ti++;
    if (ti >= targets.length) return true;
  }
  return false;
}

/**
 * Validates that each group member logged {@link CHAT_DAILY_FORWARD_CHAPTER_GOAL} consecutive
 * plan ordinals today, forward in time, starting at baseline+1, where baseline reconciles
 * history with {@link pairSharedChaptersFromPlan} so grace resets lower the bar the same day.
 */
export function computeChatDailySharedReading(input: {
  practiceDateYmd: string;
  practiceTimeZone: string;
  planStartBookId: string;
  planStartChapter: number;
  pairSharedChaptersFromPlan: number;
  memberUserIds: string[];
  events: ChatSoapsChapterEventRow[];
  progressRows: readonly { user_id: string; book_id: string; last_completed_chapter: number }[];
  forwardChapterGoal?: number;
}): ChatDailySharedReadingResult {
  const goalLen = input.forwardChapterGoal ?? CHAT_DAILY_FORWARD_CHAPTER_GOAL;
  const { practiceDateYmd, practiceTimeZone, planStartBookId, planStartChapter } = input;

  const beforeDay = filterEventsBeforeDay(input.events, practiceDateYmd, practiceTimeZone);
  const onDay = filterEventsInDay(input.events, practiceDateYmd, practiceTimeZone);

  const fromHistory = sharedBaselineFromHistory(
    input.memberUserIds,
    beforeDay,
    input.progressRows,
    planStartBookId,
    planStartChapter
  );

  const sharedBaselineOrdinal = Math.min(
    fromHistory,
    Math.max(0, Math.floor(input.pairSharedChaptersFromPlan))
  );

  const targetSummary = formatTargetSummary(
    planStartBookId,
    planStartChapter,
    sharedBaselineOrdinal,
    goalLen
  );

  const eachMemberMet: Record<string, boolean> = {};
  let allMet = input.memberUserIds.length > 0;
  for (const uid of input.memberUserIds) {
    const met = userMetOrderedForwardGoal(
      uid,
      onDay,
      planStartBookId,
      planStartChapter,
      sharedBaselineOrdinal,
      goalLen
    );
    eachMemberMet[uid] = met;
    if (!met) allMet = false;
  }

  let accountabilityMessage: string;
  if (input.memberUserIds.length === 0) {
    accountabilityMessage =
      "Add another member to your CHAT group to track shared daily reading together.";
  } else if (allMet) {
    accountabilityMessage = `Your pair completed today's shared reading (${goalLen} chapters forward from your shared place).`;
  } else {
    accountabilityMessage = `Today's shared goal: the next ${goalLen} chapters forward together (${targetSummary}). Each person's reader completions count when they're logged in order today.`;
  }

  return {
    practiceDateYmd,
    goalForwardChapters: goalLen,
    sharedBaselineOrdinal,
    pairMetGoalToday: allMet,
    eachMemberMet,
    targetSummary,
    accountabilityMessage,
  };
}
