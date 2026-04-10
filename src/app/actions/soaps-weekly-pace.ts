"use server";

import { SOAPS_WEEKLY_GOAL_SESSIONS } from "@/lib/dashboard/soaps-weekly-constants";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import { getMetricsAnchorWindow } from "@/lib/dashboard/metrics-anchor-window";
import type { WeeklyRhythmPaceResult } from "@/lib/dashboard/weekly-rhythm-pace";
import {
  computeWeeklyRhythmPace,
  expectedUnitsForPaceDay,
} from "@/lib/dashboard/weekly-rhythm-pace";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

export async function getSoapsWeeklyPace(): Promise<
  { error: string } | WeeklyRhythmPaceResult
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const anchor = getMetricsAnchorWindow(user.created_at, now, tz);
  const ob = anchor.mode === "onboarding";

  const { data: rows, error } = await supabase
    .from("journal_entries")
    .select("scripture_text, soaps_share, user_reflection, prayer, application")
    .eq("user_id", user.id)
    .gte("entry_date", anchor.queryStartYmd)
    .lte("entry_date", anchor.queryEndYmdInclusive);

  if (error) return { error: error.message };

  const actual = (rows ?? []).filter((r) => isQualifyingSoapsEntry(r)).length;

  const expectedSoFar = expectedUnitsForPaceDay(
    anchor.dayIndex,
    SOAPS_WEEKLY_GOAL_SESSIONS,
    { onboardingFirstDayZero: ob }
  );

  return computeWeeklyRhythmPace({
    actual,
    weeklyGoal: SOAPS_WEEKLY_GOAL_SESSIONS,
    needleSensitivity: 9,
    unitSingular: "session",
    unitPlural: "sessions",
    goalLabel: `${SOAPS_WEEKLY_GOAL_SESSIONS} SOAPS sessions`,
    asOf: now,
    practiceTimeZone: tz,
    daysElapsed: anchor.dayIndex,
    expectedSoFarOverride: expectedSoFar,
    paceContext: ob ? "onboarding_first_week" : "default",
  });
}
