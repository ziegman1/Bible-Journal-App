import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { FALLBACK_PRACTICE_TIMEZONE } from "@/lib/timezone/practice-timezone-shared";
import { effectiveMetricsStartYmd } from "@/lib/profile/practice-metrics-anchor";
import {
  pillarWeekDaysElapsedInclusive,
  pillarWeekRangeForQuery,
  ymdAddCalendarDays,
} from "@/lib/dashboard/pillar-week";

function resolveTz(timeZone?: string): string {
  const z = timeZone?.trim();
  if (z) return z;
  return FALLBACK_PRACTICE_TIMEZONE;
}

/** Inclusive calendar days from startYmd through endYmd (yyyy-MM-dd), minimum 1; not capped at 7. */
export function inclusiveCalendarDaysBetween(startYmd: string, endYmd: string): number {
  const [y0, m0, d0] = startYmd.split("-").map(Number);
  const [y1, m1, d1] = endYmd.split("-").map(Number);
  if ([y0, m0, d0, y1, m1, d1].some((n) => !Number.isFinite(n))) return 1;
  const t0 = Date.UTC(y0!, m0! - 1, d0!);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const diff = Math.floor((t1 - t0) / 86400000) + 1;
  return Math.max(1, diff);
}

export type MetricsAnchorWindow =
  | {
      mode: "onboarding";
      /** Signup calendar date in practice TZ */
      signupYmd: string;
      /** 1–7: day 1 = signup day */
      dayIndex: number;
      totalDays: 7;
      queryStartYmd: string;
      queryEndYmdInclusive: string;
      startIso: string;
      endExclusiveIso: string;
    }
  | {
      mode: "weekly";
      weekStartYmd: string;
      weekEndYmdInclusive: string;
      /** 1–7 Sun–Sat in practice TZ */
      dayIndex: number;
      queryStartYmd: string;
      queryEndYmdInclusive: string;
      startIso: string;
      endExclusiveIso: string;
    };

/**
 * First 7 local calendar days after signup (in practice TZ) use a personal anchor so mid-week
 * signups are not compared to a Sun–Sat week that started before they joined. Day 8+ uses normal
 * pillar weeks.
 */
export function getMetricsAnchorWindow(
  userCreatedAt: string | null | undefined,
  now: Date,
  timeZone?: string,
  /** Profile reset anchor — first metrics day after “start over” (see `practice_metrics_anchor_ymd`). */
  practiceMetricsAnchorYmd?: string | null
): MetricsAnchorWindow {
  const tz = resolveTz(timeZone);
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");

  if (!userCreatedAt) {
    return weeklyAnchor(now, tz);
  }

  const signupYmd = effectiveMetricsStartYmd(userCreatedAt, practiceMetricsAnchorYmd, tz);
  const daysSinceSignup = inclusiveCalendarDaysBetween(signupYmd, todayYmd);

  if (daysSinceSignup > 7) {
    return weeklyAnchor(now, tz);
  }

  return {
    mode: "onboarding",
    signupYmd,
    dayIndex: daysSinceSignup,
    totalDays: 7,
    queryStartYmd: signupYmd,
    queryEndYmdInclusive: todayYmd,
    startIso: fromZonedTime(`${signupYmd}T00:00:00`, tz).toISOString(),
    endExclusiveIso: fromZonedTime(
      `${ymdAddCalendarDays(todayYmd, 1)}T00:00:00`,
      tz
    ).toISOString(),
  };
}

function weeklyAnchor(now: Date, tz: string): MetricsAnchorWindow {
  const r = pillarWeekRangeForQuery(now, tz);
  return {
    mode: "weekly",
    weekStartYmd: r.startYmd,
    weekEndYmdInclusive: r.endYmdInclusive,
    dayIndex: pillarWeekDaysElapsedInclusive(now, tz),
    queryStartYmd: r.startYmd,
    queryEndYmdInclusive: r.endYmdInclusive,
    startIso: r.startIso,
    endExclusiveIso: r.endExclusiveIso,
  };
}
