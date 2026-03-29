"use server";

import { revalidatePath } from "next/cache";
import {
  emptyShareReceivedCounts,
  isShareEncounterFollowUp,
  isShareEncounterReceived,
  isShareEncounterSharedType,
  type ShareReceivedCounts,
} from "@/lib/dashboard/share-encounter-types";
import { SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { buildShareWeeklyPace } from "@/lib/dashboard/share-weekly-pace";
import type { WeeklyRhythmPaceResult } from "@/lib/dashboard/weekly-rhythm-pace";
import { utcDateYmd, startOfUtcWeekMonday } from "@/lib/dashboard/utc-week";
import { createClient } from "@/lib/supabase/server";

export type ShareDashboardStats = WeeklyRhythmPaceResult & {
  receivedCounts: ShareReceivedCounts;
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

  const now = new Date();
  const weekStart = startOfUtcWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const startYmd = utcDateYmd(weekStart);
  const endYmd = utcDateYmd(weekEnd);

  const { data: rows, error } = await supabase
    .from("share_encounters")
    .select("received")
    .eq("user_id", user.id)
    .gte("encounter_date", startYmd)
    .lte("encounter_date", endYmd);

  if (error) return { error: error.message };

  const receivedCounts = emptyShareReceivedCounts();
  for (const r of rows ?? []) {
    const key = r.received;
    if (key && key in receivedCounts) {
      receivedCounts[key as keyof ShareReceivedCounts] += 1;
    }
  }

  const actual = rows?.length ?? 0;
  const pace = buildShareWeeklyPace(actual, now);
  return { ...pace, receivedCounts };
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
    return { error: "Choose a follow-up path." };
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
