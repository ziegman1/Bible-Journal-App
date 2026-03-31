import { formatInTimeZone } from "date-fns-tz";
import {
  PILLAR_WEEK_TIMEZONE,
  pillarWeekStartKeyFromDateYmd,
  startOfPillarWeek,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";
import type { SoapsJournalRow } from "@/lib/dashboard/soaps-entry";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";

/** Daily prayer goal for streak (≥1 hr logged that calendar day in pillar TZ). */
export const PRAYER_STREAK_MIN_MINUTES_PER_DAY = 60;

export function pillarTodayYmd(now: Date = new Date()): string {
  return formatInTimeZone(now, PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
}

function isoToPillarYmd(iso: string): string {
  return formatInTimeZone(new Date(iso), PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
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

export function buildPrayerMinutesByPillarDay(
  wheel: readonly { completed_at: string; duration_minutes: number | null }[],
  extra: readonly { logged_at: string; minutes: number | null }[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of wheel) {
    const day = isoToPillarYmd(row.completed_at);
    m.set(day, (m.get(day) ?? 0) + (row.duration_minutes ?? 0));
  }
  for (const row of extra) {
    const day = isoToPillarYmd(row.logged_at);
    m.set(day, (m.get(day) ?? 0) + (row.minutes ?? 0));
  }
  return m;
}

export function prayerStreakFromDailyMinutes(
  byDay: Map<string, number>,
  todayYmd: string,
  minMinutes: number = PRAYER_STREAK_MIN_MINUTES_PER_DAY
): number {
  return consecutiveDayStreak((d) => (byDay.get(d) ?? 0) >= minMinutes, todayYmd);
}

export function shareStreakFromEncounterDates(
  encounterDates: readonly string[],
  todayYmd: string
): number {
  const set = new Set(encounterDates.map((d) => d.slice(0, 10)));
  return consecutiveDayStreak((d) => set.has(d), todayYmd);
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
  groupIds: ReadonlySet<string>
): Set<string> {
  const out = new Set<string>();
  for (const mt of meetings) {
    if (mt.status !== "completed") continue;
    if (!groupIds.has(mt.group_id)) continue;
    if (!attendedMeetingIds.has(mt.meeting_id)) continue;
    const wk = pillarWeekStartKeyFromDateYmd(mt.meeting_date);
    out.add(wk);
  }
  return out;
}

/**
 * Consecutive pillar weeks where the user attended ≥1 completed 3/3rds meeting and ≥1 CHAT meeting.
 */
export function thirdsChatWeeklyStreak(params: {
  now: Date;
  thirdsGroupIds: readonly string[];
  chatGroupId: string | null;
  meetings: readonly MeetingAttendanceRow[];
  attendedMeetingIds: ReadonlySet<string>;
}): number {
  const { now, thirdsGroupIds, chatGroupId, meetings, attendedMeetingIds } = params;
  if (thirdsGroupIds.length === 0 || !chatGroupId) return 0;

  const thirdsSet = new Set(thirdsGroupIds);
  const chatSet = new Set([chatGroupId]);

  const thirdsWeeks = weekKeysAttendedByGroup(meetings, attendedMeetingIds, thirdsSet);
  const chatWeeks = weekKeysAttendedByGroup(meetings, attendedMeetingIds, chatSet);

  const both = (weekStartYmd: string) =>
    thirdsWeeks.has(weekStartYmd) && chatWeeks.has(weekStartYmd);

  let wk = formatInTimeZone(startOfPillarWeek(now), PILLAR_WEEK_TIMEZONE, "yyyy-MM-dd");
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
