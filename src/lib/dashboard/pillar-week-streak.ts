import { formatInTimeZone } from "date-fns-tz";
import {
  startOfPillarWeek,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";

/**
 * Consecutive pillar weeks (Sun–Sat, practice TZ) where `qualifiedWeekStarts` contains
 * that week’s Sunday `yyyy-MM-dd`. If the current week is not qualified, the streak
 * continues from prior weeks (same pattern as legacy 3/3+CHAT combined streak).
 */
export function consecutivePillarWeekStreak(
  qualifiedWeekStarts: ReadonlySet<string>,
  now: Date,
  practiceTimeZone: string
): number {
  const tz = practiceTimeZone;
  let wk = formatInTimeZone(startOfPillarWeek(now, tz), tz, "yyyy-MM-dd");
  let count = 0;

  if (qualifiedWeekStarts.has(wk)) {
    count++;
    wk = ymdAddCalendarDays(wk, -7);
  } else {
    wk = ymdAddCalendarDays(wk, -7);
  }

  while (qualifiedWeekStarts.has(wk)) {
    count++;
    wk = ymdAddCalendarDays(wk, -7);
  }

  return count;
}
