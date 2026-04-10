"use server";

import { revalidatePath } from "next/cache";
import { prayerfulnessPercent } from "@/lib/prayer-wheel/stats";
import { getMetricsAnchorWindow } from "@/lib/dashboard/metrics-anchor-window";
import { pillarWeekRangeForQuery } from "@/lib/dashboard/pillar-week";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

export type PrayerWheelDashboardStats = {
  /** Prayer Wheel segments + à la carte minutes */
  weeklyMinutes: number;
  weeklySegments: number;
  /** Minutes from completed wheel segments only */
  weeklyWheelMinutes: number;
  /** Minutes from “Extra prayer time” saves this week */
  weeklyExtraMinutes: number;
  /** Full wheels ≈ floor(segments / 12) this week */
  fullWheelsThisWeek: number;
  prayerfulnessPercent: number;
  weeklyGoalMinutes: number;
  /** For dashboard needle: matches {@link getMetricsAnchorWindow} day index. */
  paceDayIndex: number;
  /** First 7 days after signup: personal pace window. */
  onboardingPaceWeek: boolean;
};

export async function getPrayerWheelDashboardStats(): Promise<
  { error: string } | PrayerWheelDashboardStats
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [{ prayerWeeklyGoalMinutes }, tz] = await Promise.all([
    fetchUserRhythmGoals(supabase, user.id),
    getPracticeTimeZone(),
  ]);
  const now = new Date();
  const anchor = getMetricsAnchorWindow(user.created_at, now, tz);
  const { startIso, endExclusiveIso } = anchor;

  const { data: rows, error } = await supabase
    .from("prayer_wheel_segment_completions")
    .select("duration_minutes")
    .eq("user_id", user.id)
    .gte("completed_at", startIso)
    .lt("completed_at", endExclusiveIso);

  if (error) return { error: error.message };

  const weeklySegments = rows?.length ?? 0;
  const weeklyWheelMinutes = (rows ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const fullWheelsThisWeek = Math.floor(weeklySegments / 12);

  const { data: extraRows, error: extraErr } = await supabase
    .from("prayer_extra_minutes")
    .select("minutes")
    .eq("user_id", user.id)
    .gte("logged_at", startIso)
    .lt("logged_at", endExclusiveIso);

  if (extraErr) return { error: extraErr.message };

  const weeklyExtraMinutes = (extraRows ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
  const weeklyMinutes = weeklyWheelMinutes + weeklyExtraMinutes;

  return {
    weeklyMinutes,
    weeklySegments,
    weeklyWheelMinutes,
    weeklyExtraMinutes,
    fullWheelsThisWeek,
    prayerfulnessPercent: prayerfulnessPercent(weeklyMinutes, prayerWeeklyGoalMinutes),
    weeklyGoalMinutes: prayerWeeklyGoalMinutes,
    paceDayIndex: anchor.dayIndex,
    onboardingPaceWeek: anchor.mode === "onboarding",
  };
}

/** Additional prayer outside the wheel; 5–180 minutes, multiples of 5. */
export async function recordExtraPrayerMinutes(
  minutes: number
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const m = Math.floor(minutes);
  if (!Number.isFinite(m) || m < 5 || m > 180 || m % 5 !== 0) {
    return { error: "Choose 5–180 minutes in steps of 5." };
  }

  const { error } = await supabase.from("prayer_extra_minutes").insert({
    user_id: user.id,
    minutes: m,
    logged_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  /* Omit /app/prayer — same RSC refresh issue as recordPrayerWheelSegment when user is on Prayer. */
  return { success: true as const };
}

export async function recordPrayerWheelSegment(
  stepIndex: number,
  durationMinutes: number
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 11) {
    return { error: "Invalid step" };
  }
  const dm = Math.floor(durationMinutes);
  if (!Number.isFinite(dm) || dm < 1 || dm > 15) {
    return { error: "Invalid duration" };
  }

  const { error } = await supabase.from("prayer_wheel_segment_completions").insert({
    user_id: user.id,
    step_index: stepIndex,
    duration_minutes: dm,
    completed_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  /* Omit /app/prayer — revalidating it can remount PrayerWheelTimer and cancel transition audio. */
  return { success: true };
}

/** Removes all Prayer Wheel segment completions and extra minutes for the current pillar week (see `pillar-week.ts`). */
export async function resetThisWeeksPrayerTime(): Promise<
  | { error: string }
  | { success: true; removedWheelSegments: number; removedExtraEntries: number }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const { startIso, endExclusiveIso } = pillarWeekRangeForQuery(new Date(), tz);

  const { data: segRemoved, error: segErr } = await supabase
    .from("prayer_wheel_segment_completions")
    .delete()
    .eq("user_id", user.id)
    .gte("completed_at", startIso)
    .lt("completed_at", endExclusiveIso)
    .select("id");

  if (segErr) return { error: segErr.message };

  const { data: extraRemoved, error: extraErr } = await supabase
    .from("prayer_extra_minutes")
    .delete()
    .eq("user_id", user.id)
    .gte("logged_at", startIso)
    .lt("logged_at", endExclusiveIso)
    .select("id");

  if (extraErr) return { error: extraErr.message };

  revalidatePath("/app");
  revalidatePath("/app/prayer");

  return {
    success: true,
    removedWheelSegments: segRemoved?.length ?? 0,
    removedExtraEntries: extraRemoved?.length ?? 0,
  };
}
