"use server";

import { revalidatePath } from "next/cache";
import { computeWeeklyRhythmPace } from "@/lib/dashboard/weekly-rhythm-pace";
import {
  endOfUtcWeekMonday,
  PRAYER_WEEKLY_GOAL_MINUTES,
  prayerfulnessPercent,
  startOfUtcWeekMonday,
} from "@/lib/prayer-wheel/stats";
import { createClient } from "@/lib/supabase/server";

/** Weekly needle pace vs 60 min Prayer Wheel goal (UTC week, same as segment stats). */
export function buildPrayerWheelWeeklyPace(weeklyMinutes: number, asOf: Date = new Date()) {
  return computeWeeklyRhythmPace({
    actual: weeklyMinutes,
    weeklyGoal: PRAYER_WEEKLY_GOAL_MINUTES,
    needleSensitivity: 0.85,
    unitSingular: "minute",
    unitPlural: "minutes",
    goalLabel: `${PRAYER_WEEKLY_GOAL_MINUTES} weekly prayer minutes`,
    asOf,
  });
}

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

  const start = startOfUtcWeekMonday().toISOString();
  const end = endOfUtcWeekMonday().toISOString();

  const { data: rows, error } = await supabase
    .from("prayer_wheel_segment_completions")
    .select("duration_minutes")
    .eq("user_id", user.id)
    .gte("completed_at", start)
    .lte("completed_at", end);

  if (error) return { error: error.message };

  const weeklySegments = rows?.length ?? 0;
  const weeklyWheelMinutes = (rows ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const fullWheelsThisWeek = Math.floor(weeklySegments / 12);

  const { data: extraRows, error: extraErr } = await supabase
    .from("prayer_extra_minutes")
    .select("minutes")
    .eq("user_id", user.id)
    .gte("logged_at", start)
    .lte("logged_at", end);

  if (extraErr) return { error: extraErr.message };

  const weeklyExtraMinutes = (extraRows ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
  const weeklyMinutes = weeklyWheelMinutes + weeklyExtraMinutes;

  return {
    weeklyMinutes,
    weeklySegments,
    weeklyWheelMinutes,
    weeklyExtraMinutes,
    fullWheelsThisWeek,
    prayerfulnessPercent: prayerfulnessPercent(weeklyMinutes, PRAYER_WEEKLY_GOAL_MINUTES),
    weeklyGoalMinutes: PRAYER_WEEKLY_GOAL_MINUTES,
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
  revalidatePath("/app/prayer");
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
  revalidatePath("/app/prayer");
  return { success: true };
}
