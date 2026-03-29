"use server";

import { revalidatePath } from "next/cache";
import {
  endOfUtcWeekMonday,
  PRAYER_WEEKLY_GOAL_MINUTES,
  prayerfulnessPercent,
  startOfUtcWeekMonday,
} from "@/lib/prayer-wheel/stats";
import { createClient } from "@/lib/supabase/server";

export type PrayerWheelDashboardStats = {
  weeklyMinutes: number;
  weeklySegments: number;
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
  const weeklyMinutes = (rows ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const fullWheelsThisWeek = Math.floor(weeklySegments / 12);

  return {
    weeklyMinutes,
    weeklySegments,
    fullWheelsThisWeek,
    prayerfulnessPercent: prayerfulnessPercent(weeklyMinutes, PRAYER_WEEKLY_GOAL_MINUTES),
    weeklyGoalMinutes: PRAYER_WEEKLY_GOAL_MINUTES,
  };
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
