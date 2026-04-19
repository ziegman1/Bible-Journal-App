"use server";

/**
 * Share dashboard: stoplights use **this week’s** encounters; the pace gauge uses **average weekly
 * goal completion %** across pillar weeks since account start (each week capped at 100%).
 * Not used by Formation Momentum.
 */

import { revalidatePath } from "next/cache";
import {
  emptyShareReceivedCounts,
  isShareEncounterFollowUp,
  isShareEncounterReceived,
  isShareEncounterSharedType,
  type ShareReceivedCounts,
} from "@/lib/dashboard/share-encounter-types";
import {
  buildShareAverageWeeklyGauge,
  pillarWeekStartsFromSignupThroughToday,
} from "@/lib/dashboard/practice-completion-gauge";
import { getMetricsAnchorWindow } from "@/lib/dashboard/metrics-anchor-window";
import { pillarWeekStartKeyFromDateYmd } from "@/lib/dashboard/pillar-week";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { pillarTodayYmd } from "@/lib/dashboard/identity-streaks";
import {
  effectiveMetricsStartYmd,
  fetchPracticeMetricsAnchorYmd,
} from "@/lib/profile/practice-metrics-anchor";
import type { PracticeCompletionGaugeVm } from "@/lib/dashboard/practice-completion-gauge";

export type ShareDashboardStats = PracticeCompletionGaugeVm & {
  receivedCounts: ShareReceivedCounts;
  weeklyGoal: number;
  pillarWeeksCounted: number;
};

export async function getShareDashboardStats(): Promise<
  { error: string } | ShareDashboardStats
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [{ shareWeeklyGoalEncounters: rawGoal }, tz, anchorYmd] = await Promise.all([
    fetchUserRhythmGoals(supabase, user.id),
    getPracticeTimeZone(),
    fetchPracticeMetricsAnchorYmd(supabase, user.id),
  ]);
  const goal = Math.max(1, Math.floor(rawGoal));
  const now = new Date();
  const startYmd = effectiveMetricsStartYmd(user.created_at, anchorYmd, tz);
  const todayYmd = pillarTodayYmd(now, tz);
  const anchor = getMetricsAnchorWindow(user.created_at, now, tz, anchorYmd);
  const weekEndCap =
    todayYmd < anchor.queryEndYmdInclusive ? todayYmd : anchor.queryEndYmdInclusive;

  const [lifeRes, weekRes] = await Promise.all([
    supabase
      .from("share_encounters")
      .select("encounter_date")
      .eq("user_id", user.id)
      .gte("encounter_date", startYmd)
      .lte("encounter_date", todayYmd),
    supabase
      .from("share_encounters")
      .select("received")
      .eq("user_id", user.id)
      .gte("encounter_date", anchor.queryStartYmd)
      .lte("encounter_date", weekEndCap),
  ]);

  const error = lifeRes.error || weekRes.error;
  if (error) return { error: error.message };

  const receivedCounts = emptyShareReceivedCounts();
  for (const r of weekRes.data ?? []) {
    const key = r.received;
    if (key && key in receivedCounts) {
      receivedCounts[key as keyof ShareReceivedCounts] += 1;
    }
  }

  const weekStarts = pillarWeekStartsFromSignupThroughToday(startYmd, todayYmd, tz);
  const byWeek = new Map<string, number>();
  for (const r of lifeRes.data ?? []) {
    const d = String(r.encounter_date).slice(0, 10);
    const wk = pillarWeekStartKeyFromDateYmd(d, tz);
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
  }

  let sumPct = 0;
  for (const wk of weekStarts) {
    const c = byWeek.get(wk) ?? 0;
    const pctW = Math.min(100, (c / goal) * 100);
    sumPct += pctW;
  }
  const averageWeeklyPercent =
    weekStarts.length > 0 ? sumPct / weekStarts.length : 0;

  const gauge = buildShareAverageWeeklyGauge(averageWeeklyPercent);

  return {
    ...gauge,
    receivedCounts,
    weeklyGoal: goal,
    pillarWeeksCounted: weekStarts.length,
  };
}

export async function recordShareEncounter(input: {
  encounterDateYmd: string;
  location: string;
  sharedType: string;
  received: string;
  followUp: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(input.encounterDateYmd)) {
    return { error: "Invalid date." };
  }

  const location = input.location.trim();
  if (location.length === 0 || location.length > 500) {
    return { error: "Location is required (max 500 characters)." };
  }

  if (!isShareEncounterSharedType(input.sharedType)) {
    return { error: "Choose what you shared." };
  }
  if (!isShareEncounterReceived(input.received)) {
    return { error: "Choose how they received it." };
  }
  if (!isShareEncounterFollowUp(input.followUp)) {
    return { error: "Choose a follow-up option." };
  }

  const { error } = await supabase.from("share_encounters").insert({
    user_id: user.id,
    encounter_date: input.encounterDateYmd,
    location,
    shared_type: input.sharedType,
    received: input.received,
    follow_up: input.followUp,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/share");
  return { success: true as const };
}
