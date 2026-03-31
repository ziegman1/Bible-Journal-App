import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";

export type UserRhythmGoals = {
  shareWeeklyGoalEncounters: number;
  prayerWeeklyGoalMinutes: number;
};

export function clampShareWeeklyGoalEncounters(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS;
  return Math.min(50, Math.max(1, Math.floor(v)));
}

export function clampPrayerWeeklyGoalMinutes(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES;
  return Math.min(600, Math.max(5, Math.floor(v)));
}

export function rhythmGoalsFromRow(row: {
  weekly_share_goal_encounters?: unknown;
  weekly_prayer_goal_minutes?: unknown;
} | null): UserRhythmGoals {
  return {
    shareWeeklyGoalEncounters: clampShareWeeklyGoalEncounters(
      row?.weekly_share_goal_encounters ?? DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS
    ),
    prayerWeeklyGoalMinutes: clampPrayerWeeklyGoalMinutes(
      row?.weekly_prayer_goal_minutes ?? DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES
    ),
  };
}

export async function fetchUserRhythmGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRhythmGoals> {
  const { data } = await supabase
    .from("profiles")
    .select("weekly_share_goal_encounters, weekly_prayer_goal_minutes")
    .eq("id", userId)
    .maybeSingle();
  return rhythmGoalsFromRow(data);
}
