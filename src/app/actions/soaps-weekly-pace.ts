"use server";

import { SOAPS_WEEKLY_GOAL_SESSIONS } from "@/lib/dashboard/soaps-weekly-constants";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import { pillarWeekRangeForQuery } from "@/lib/dashboard/pillar-week";
import type { WeeklyRhythmPaceResult } from "@/lib/dashboard/weekly-rhythm-pace";
import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";
import { createClient } from "@/lib/supabase/server";

export async function getSoapsWeeklyPace(): Promise<
  { error: string } | WeeklyRhythmPaceResult
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const now = new Date();
  const { startYmd, endYmdInclusive: endYmd } = pillarWeekRangeForQuery(now);

  const { data: rows, error } = await supabase
    .from("journal_entries")
    .select("scripture_text, soaps_share, user_reflection, prayer, application")
    .eq("user_id", user.id)
    .gte("entry_date", startYmd)
    .lte("entry_date", endYmd);

  if (error) return { error: error.message };

  const actual = (rows ?? []).filter((r) => isQualifyingSoapsEntry(r)).length;

  return computeWeeklyRhythmPace({
    actual,
    weeklyGoal: SOAPS_WEEKLY_GOAL_SESSIONS,
    needleSensitivity: 9,
    unitSingular: "session",
    unitPlural: "sessions",
    goalLabel: `${SOAPS_WEEKLY_GOAL_SESSIONS} SOAPS sessions`,
    asOf: now,
  });
}
