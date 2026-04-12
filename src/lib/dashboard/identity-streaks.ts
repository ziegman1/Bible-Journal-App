import { formatInTimeZone } from "date-fns-tz";
import {
  pillarWeekStartKeyFromDateYmd,
  startOfPillarWeek,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import type { SoapsJournalRow } from "@/lib/dashboard/soaps-entry";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";

export function pillarTodayYmd(now: Date, practiceTimeZone: string): string {
  return formatInTimeZone(now, practiceTimeZone, "yyyy-MM-dd");
}

/**
 * Streak anchored at the most recent qualifying day (today if logged; else yesterday can
 * extend the streak until today is satisfied).
 */
export function consecutiveDayStreak(
  hasOnDay: (ymd: string) => boolean,
  todayYmd: string
): number {
  let d = todayYmd;
  if (!hasOnDay(d)) {
    d = ymdAddCalendarDays(todayYmd, -1);
  }
  if (!hasOnDay(d)) return 0;

  let n = 0;
  while (hasOnDay(d)) {
    n++;
    d = ymdAddCalendarDays(d, -1);
  }
  return n;
}

export function prayerStreakFromQualifyingDays(
  days: Set<string>,
  todayYmd: string
): number {
  return consecutiveDayStreak((d) => days.has(d), todayYmd);
}

export function buildSoapsQualifyingDaySet(
  rows: readonly (SoapsJournalRow & { entry_date: string })[]
): Set<string> {
  const byDay = new Map<string, SoapsJournalRow[]>();
  for (const row of rows) {
    const day = row.entry_date.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }
  const out = new Set<string>();
  for (const [day, list] of byDay) {
    if (list.some((r) => isQualifyingSoapsEntry(r))) out.add(day);
  }
  return out;
}

export function shareStreakFromEncounterDates(
  encounterDates: readonly string[],
  todayYmd: string
): number {
  const set = new Set(encounterDates.map((d) => d.slice(0, 10)));
  return consecutiveDayStreak((d) => set.has(d), todayYmd);
}

/** A Scripture Memory day counts when the user logged new memorization or any review. */
export function scriptureMemoryDayStreakFromRows(
  rows: readonly {
    practice_date: string;
    memorized_new_count?: number | null;
    reviewed_count?: number | null;
  }[],
  todayYmd: string
): number {
  const qualifying = new Set<string>();
  for (const r of rows) {
    const d = r.practice_date.slice(0, 10);
    const mem = r.memorized_new_count ?? 0;
    const rev = r.reviewed_count ?? 0;
    if (mem > 0 || rev > 0) qualifying.add(d);
  }
  return consecutiveDayStreak((d) => qualifying.has(d), todayYmd);
}

export type MeetingAttendanceRow = {
  meeting_id: string;
  group_id: string;
  meeting_date: string;
  status: string;
};

function weekKeysAttendedByGroup(
  meetings: readonly MeetingAttendanceRow[],
  attendedMeetingIds: ReadonlySet<string>,
  groupIds: ReadonlySet<string>,
  practiceTimeZone: string
): Set<string> {
  const out = new Set<string>();
  for (const mt of meetings) {
    if (mt.status !== "completed") continue;
    if (!groupIds.has(mt.group_id)) continue;
    if (!attendedMeetingIds.has(mt.meeting_id)) continue;
    const wk = pillarWeekStartKeyFromDateYmd(mt.meeting_date, practiceTimeZone);
    out.add(wk);
  }
  return out;
}

/**
 * Consecutive pillar weeks where the user attended ≥1 completed 3/3rds meeting and ≥1 CHAT meeting.
 */
export function thirdsChatWeeklyStreak(params: {
  now: Date;
  practiceTimeZone: string;
  thirdsGroupIds: readonly string[];
  chatGroupId: string | null;
  meetings: readonly MeetingAttendanceRow[];
  attendedMeetingIds: ReadonlySet<string>;
}): number {
  const { now, practiceTimeZone, thirdsGroupIds, chatGroupId, meetings, attendedMeetingIds } =
    params;
  if (thirdsGroupIds.length === 0 || !chatGroupId) return 0;

  const thirdsSet = new Set(thirdsGroupIds);
  const chatSet = new Set([chatGroupId]);

  const thirdsWeeks = weekKeysAttendedByGroup(
    meetings,
    attendedMeetingIds,
    thirdsSet,
    practiceTimeZone
  );
  const chatWeeks = weekKeysAttendedByGroup(
    meetings,
    attendedMeetingIds,
    chatSet,
    practiceTimeZone
  );

  const both = (weekStartYmd: string) =>
    thirdsWeeks.has(weekStartYmd) && chatWeeks.has(weekStartYmd);

  let wk = formatInTimeZone(startOfPillarWeek(now, practiceTimeZone), practiceTimeZone, "yyyy-MM-dd");
  let count = 0;

  if (both(wk)) {
    count++;
    wk = ymdAddCalendarDays(wk, -7);
  } else {
    wk = ymdAddCalendarDays(wk, -7);
  }

  while (both(wk)) {
    count++;
    wk = ymdAddCalendarDays(wk, -7);
  }

  return count;
}
