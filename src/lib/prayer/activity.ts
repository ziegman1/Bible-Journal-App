import { formatInTimeZone } from "date-fns-tz";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";

export function isoToPracticeYmd(iso: string, practiceTimeZone: string): string {
  return formatInTimeZone(new Date(iso), practiceTimeZone, "yyyy-MM-dd");
}

/**
 * Days with any qualifying prayer activity (wheel segment, extra time, or freestyle session).
 */
export function buildPrayerQualifyingDaySet(
  wheel: readonly { completed_at: string }[],
  extra: readonly { logged_at: string }[],
  freestyle: readonly { ended_at: string }[],
  practiceTimeZone: string
): Set<string> {
  const out = new Set<string>();
  for (const row of wheel) {
    out.add(isoToPracticeYmd(row.completed_at, practiceTimeZone));
  }
  for (const row of extra) {
    out.add(isoToPracticeYmd(row.logged_at, practiceTimeZone));
  }
  for (const row of freestyle) {
    out.add(isoToPracticeYmd(row.ended_at, practiceTimeZone));
  }
  return out;
}

/** Longest run of consecutive calendar days present in the set (historical). */
/**
 * Count distinct qualifying days from `qualifying` that fall on or after `windowStartYmd`
 * and on or before `windowEndCapYmd` (inclusive). Expect ISO yyyy-MM-dd strings.
 */
export function countQualifyingDaysInWindow(
  qualifying: Set<string>,
  windowStartYmd: string,
  windowEndCapYmd: string
): number {
  if (windowStartYmd > windowEndCapYmd) return 0;
  let n = 0;
  let d = windowStartYmd;
  for (;;) {
    if (qualifying.has(d)) n++;
    if (d === windowEndCapYmd) break;
    d = ymdAddCalendarDays(d, 1);
  }
  return n;
}

export function longestPrayerStreakInDaySet(days: Set<string>): number {
  if (days.size === 0) return 0;
  const sorted = [...days].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (ymdAddCalendarDays(prev, 1) === cur) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}
