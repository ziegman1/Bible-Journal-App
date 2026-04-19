"use server";

/**
 * CHAT dashboard gauge — **overall pillar-week completion %**: weeks with a reading check-in for this
 * group / total pillar weeks since account start. Not Formation Momentum.
 */

import {
  effectiveMetricsStartYmd,
  fetchPracticeMetricsAnchorYmd,
} from "@/lib/profile/practice-metrics-anchor";
import {
  buildWeeklyCompletionGauge,
  pillarWeekStartsFromSignupThroughToday,
  type PracticeCompletionGaugeVm,
} from "@/lib/dashboard/practice-completion-gauge";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { pillarTodayYmd } from "@/lib/dashboard/identity-streaks";

export type ChatWeeklyCompletionGaugeResult = PracticeCompletionGaugeVm & {
  totalPillarWeeks: number;
  weeksWithCheckIn: number;
};

export async function getChatWeeklyCompletionGauge(
  groupId: string
): Promise<{ error: string } | ChatWeeklyCompletionGaugeResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const anchorYmd = await fetchPracticeMetricsAnchorYmd(supabase, user.id);
  const startYmd = effectiveMetricsStartYmd(user.created_at, anchorYmd, tz);
  const todayYmd = pillarTodayYmd(now, tz);
  const weekStarts = pillarWeekStartsFromSignupThroughToday(startYmd, todayYmd, tz);
  const totalPillarWeeks = weekStarts.length;

  const firstSunday = weekStarts[0] ?? startYmd;
  const lastSunday = weekStarts[weekStarts.length - 1] ?? todayYmd;

  const { data: checkIns, error } = await supabase
    .from("chat_reading_check_ins")
    .select("week_start_ymd")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .gte("week_start_ymd", firstSunday)
    .lte("week_start_ymd", lastSunday);

  if (error) return { error: error.message };

  const done = new Set(
    (checkIns ?? []).map((r) => String(r.week_start_ymd).slice(0, 10))
  );
  const weeksWithCheckIn = weekStarts.filter((w) => done.has(w)).length;

  const gauge = buildWeeklyCompletionGauge(
    weeksWithCheckIn,
    totalPillarWeeks,
    "CHAT weeks with a reading check-in"
  );

  return {
    ...gauge,
    totalPillarWeeks,
    weeksWithCheckIn,
  };
}
