"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { aggregateInsights, getDateBounds } from "@/lib/insights/aggregate";
import { generateInsightSummary } from "@/lib/ai/insight-summary";
import type { InsightsDateRange } from "@/lib/insights/types";
import type { InsightSummaryJSON } from "@/lib/insights/types";

const AI_DAILY_LIMIT = 25;

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getCachedInsightSummary(
  rangeType: string,
  startDate: string,
  endDate: string
): Promise<{ summary: InsightSummaryJSON } | { error: string } | null> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("insight_summaries")
    .select("summary_json")
    .eq("user_id", user.id)
    .eq("range_type", rangeType)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .maybeSingle();

  if (error || !data?.summary_json) return null;
  return { summary: data.summary_json as InsightSummaryJSON };
}

export async function generateInsightSummaryAction(
  range: InsightsDateRange,
  customStart?: string,
  customEnd?: string
): Promise<
  | { success: true; summary: InsightSummaryJSON }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const bounds = getDateBounds(range, customStart, customEnd);

  const todayUtc = getTodayUTC();
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("request_count")
    .eq("user_id", user.id)
    .eq("usage_date", todayUtc)
    .single();

  const count = usage?.request_count ?? 0;
  if (count >= AI_DAILY_LIMIT) {
    return {
      success: false,
      error: `You've reached your daily limit of ${AI_DAILY_LIMIT} AI requests. Your limit resets at midnight UTC. Try again tomorrow!`,
    };
  }

  const summary = await aggregateInsights(supabase, user.id, bounds);
  const result = await generateInsightSummary(summary);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  await supabase.rpc("increment_ai_usage", {
    p_user_id: user.id,
    p_usage_date: todayUtc,
  });

  const { error: insertError } = await supabase.from("insight_summaries").upsert(
    {
      user_id: user.id,
      range_type: range,
      start_date: bounds.start,
      end_date: bounds.end,
      summary_json: result.data,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,range_type,start_date,end_date",
    }
  );

  if (insertError) {
    return { success: false, error: "Could not save summary. Please try again." };
  }

  revalidatePath("/app/insights");
  return { success: true, summary: result.data };
}
