"use server";

import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { revalidatePath } from "next/cache";

/**
 * Sets `practice_metrics_anchor_ymd` to **today** in the user’s practice timezone so dashboards,
 * streaks, and formation momentum treat activity from this day forward as a fresh metrics baseline.
 * Historical rows are not deleted.
 */
export async function resetPracticeMetrics(): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const todayYmd = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");

  const { error } = await supabase
    .from("profiles")
    .update({
      practice_metrics_anchor_ymd: todayYmd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/share");
  revalidatePath("/app/prayer");
  revalidatePath("/app/scripture-memory");
  return { success: true };
}
