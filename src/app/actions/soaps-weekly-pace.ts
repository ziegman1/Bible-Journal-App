"use server";

/**
 * SOAPS dashboard gauge — **overall daily completion %** (qualifying SOAPS days / days since
 * account start). Not used by Formation Momentum.
 */

import { SOAPS_WEEKLY_GOAL_SESSIONS } from "@/lib/dashboard/soaps-weekly-constants";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import {
  buildDailyCompletionGauge,
  type PracticeCompletionGaugeVm,
} from "@/lib/dashboard/practice-completion-gauge";
import {
  effectiveMetricsStartYmd,
  fetchPracticeMetricsAnchorYmd,
} from "@/lib/profile/practice-metrics-anchor";
import { inclusiveCalendarDaysBetween } from "@/lib/dashboard/metrics-anchor-window";
import {
  buildSoapsQualifyingDaySet,
  pillarTodayYmd,
} from "@/lib/dashboard/identity-streaks";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { countDaysInRangeInSet } from "@/lib/dashboard/practice-completion-gauge";

export type SoapsCompletionGaugeResult = PracticeCompletionGaugeVm & {
  totalDays: number;
  qualifyingDays: number;
  weeklyGoalSessions: number;
};

export async function getSoapsWeeklyPace(): Promise<
  { error: string } | SoapsCompletionGaugeResult
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const anchorYmd = await fetchPracticeMetricsAnchorYmd(supabase, user.id);
  const startYmd = effectiveMetricsStartYmd(user.created_at, anchorYmd, tz);
  const todayYmd = pillarTodayYmd(now, tz);

  const { data: rows, error } = await supabase
    .from("journal_entries")
    .select("scripture_text, soaps_share, user_reflection, prayer, application, entry_date")
    .eq("user_id", user.id)
    .gte("entry_date", startYmd)
    .lte("entry_date", todayYmd);

  if (error) return { error: error.message };

  const daySet = buildSoapsQualifyingDaySet(rows ?? []);
  const qualifyingDays = countDaysInRangeInSet(daySet, startYmd, todayYmd);
  const totalDays = inclusiveCalendarDaysBetween(startYmd, todayYmd);

  const gauge = buildDailyCompletionGauge(
    qualifyingDays,
    totalDays,
    "qualifying SOAPS days"
  );

  return {
    ...gauge,
    totalDays,
    qualifyingDays,
    weeklyGoalSessions: SOAPS_WEEKLY_GOAL_SESSIONS,
  };
}
