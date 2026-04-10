"use server";

import { revalidatePath } from "next/cache";
import {
  pillarTodayYmd,
  scriptureMemoryDayStreakFromRows,
} from "@/lib/dashboard/identity-streaks";
import { practiceMonthStartEndYmd, clampMeterRatio } from "@/lib/scripture-memory/metrics";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { createClient } from "@/lib/supabase/server";

export type ScriptureMemoryLogRow = {
  practice_date: string;
  memorized_new_count: number;
  reviewed_count: number;
};

export type ScriptureMemorySettingsRow = {
  monthly_new_passages_goal: number;
  daily_review_goal: number;
  current_total_memorized: number;
};

const LOOKBACK = 800;

async function ensureScriptureMemorySettings(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string
): Promise<{ data: ScriptureMemorySettingsRow; error: null } | { data: null; error: string }> {
  const { data: existing } = await supabase
    .from("scripture_memory_settings")
    .select("monthly_new_passages_goal, daily_review_goal, current_total_memorized")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return {
      data: {
        monthly_new_passages_goal: existing.monthly_new_passages_goal ?? 5,
        daily_review_goal: existing.daily_review_goal ?? 5,
        current_total_memorized: existing.current_total_memorized ?? 0,
      },
      error: null,
    };
  }

  const { data: logRows } = await supabase
    .from("scripture_memory_logs")
    .select("memorized_new_count")
    .eq("user_id", userId);

  let sumFromLogs = 0;
  for (const r of logRows ?? []) {
    sumFromLogs += r.memorized_new_count ?? 0;
  }

  const { data: inserted, error } = await supabase
    .from("scripture_memory_settings")
    .insert({
      user_id: userId,
      monthly_new_passages_goal: 5,
      daily_review_goal: 5,
      current_total_memorized: sumFromLogs,
    })
    .select("monthly_new_passages_goal, daily_review_goal, current_total_memorized")
    .single();

  if (error || !inserted) {
    return { data: null, error: error?.message ?? "Could not create Scripture Memory settings." };
  }

  return {
    data: {
      monthly_new_passages_goal: inserted.monthly_new_passages_goal ?? 5,
      daily_review_goal: inserted.daily_review_goal ?? 5,
      current_total_memorized: inserted.current_total_memorized ?? 0,
    },
    error: null,
  };
}

export async function getScriptureMemoryDashboardBundle(): Promise<{
  streakDays: number;
  monthlyMemorized: number;
  monthlyGoal: number;
  todayReviewed: number;
  dailyReviewGoal: number;
  currentTotalMemorized: number;
  monthMeterRatio: number;
  dayMeterRatio: number;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      streakDays: 0,
      monthlyMemorized: 0,
      monthlyGoal: 5,
      todayReviewed: 0,
      dailyReviewGoal: 5,
      currentTotalMemorized: 0,
      monthMeterRatio: 0,
      dayMeterRatio: 0,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      streakDays: 0,
      monthlyMemorized: 0,
      monthlyGoal: 5,
      todayReviewed: 0,
      dailyReviewGoal: 5,
      currentTotalMemorized: 0,
      monthMeterRatio: 0,
      dayMeterRatio: 0,
    };
  }

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const todayYmd = pillarTodayYmd(now, tz);
  const { monthStartYmd, monthEndYmd } = practiceMonthStartEndYmd(now, tz);
  const monthUpper = todayYmd < monthEndYmd ? todayYmd : monthEndYmd;

  const ensured = await ensureScriptureMemorySettings(supabase, user.id);
  const settings = ensured.data ?? {
    monthly_new_passages_goal: 5,
    daily_review_goal: 5,
    current_total_memorized: 0,
  };

  const [{ data: streakRows }, { data: monthRows }, { data: todayRow }] = await Promise.all([
    supabase
      .from("scripture_memory_logs")
      .select("practice_date, memorized_new_count, reviewed_count")
      .eq("user_id", user.id)
      .gte("practice_date", ymdAddCalendarDays(todayYmd, -LOOKBACK)),
    supabase
      .from("scripture_memory_logs")
      .select("memorized_new_count")
      .eq("user_id", user.id)
      .gte("practice_date", monthStartYmd)
      .lte("practice_date", monthUpper),
    supabase
      .from("scripture_memory_logs")
      .select("reviewed_count")
      .eq("user_id", user.id)
      .eq("practice_date", todayYmd)
      .maybeSingle(),
  ]);

  const streakDays = scriptureMemoryDayStreakFromRows(streakRows ?? [], todayYmd);

  let monthlyMemorized = 0;
  for (const r of monthRows ?? []) {
    monthlyMemorized += r.memorized_new_count ?? 0;
  }

  const todayReviewed = todayRow?.reviewed_count ?? 0;
  const monthlyGoal = settings.monthly_new_passages_goal;
  const dailyReviewGoal = settings.daily_review_goal;

  return {
    streakDays,
    monthlyMemorized,
    monthlyGoal,
    todayReviewed,
    dailyReviewGoal,
    currentTotalMemorized: settings.current_total_memorized,
    monthMeterRatio: clampMeterRatio(monthlyMemorized, monthlyGoal),
    dayMeterRatio: clampMeterRatio(todayReviewed, dailyReviewGoal),
  };
}

/** @deprecated Use getScriptureMemoryDashboardBundle for card metrics */
export async function getScriptureMemoryStreakSummary(): Promise<{
  streakDays: number;
}> {
  const b = await getScriptureMemoryDashboardBundle();
  return { streakDays: b.streakDays };
}

export async function getScriptureMemoryPageData(): Promise<
  | { error: string }
  | {
      todayYmd: string;
      today: ScriptureMemoryLogRow | null;
      streakDays: number;
      recent: ScriptureMemoryLogRow[];
      settings: ScriptureMemorySettingsRow;
      monthlyMemorized: number;
      monthStartYmd: string;
      monthEndYmd: string;
      todayReviewed: number;
      monthMeterRatio: number;
      dayMeterRatio: number;
    }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const todayYmd = pillarTodayYmd(now, tz);
  const recentStart = ymdAddCalendarDays(todayYmd, -13);
  const { monthStartYmd, monthEndYmd } = practiceMonthStartEndYmd(now, tz);
  const monthUpper = todayYmd < monthEndYmd ? todayYmd : monthEndYmd;

  const ensured = await ensureScriptureMemorySettings(supabase, user.id);
  if (!ensured.data) return { error: ensured.error ?? "Settings unavailable" };
  const settings = ensured.data;

  const [
    { data: allForStreak },
    { data: todayRow },
    { data: recentRows },
    { data: monthRows },
  ] = await Promise.all([
    supabase
      .from("scripture_memory_logs")
      .select("practice_date, memorized_new_count, reviewed_count")
      .eq("user_id", user.id)
      .gte("practice_date", ymdAddCalendarDays(todayYmd, -LOOKBACK)),
    supabase
      .from("scripture_memory_logs")
      .select("practice_date, memorized_new_count, reviewed_count")
      .eq("user_id", user.id)
      .eq("practice_date", todayYmd)
      .maybeSingle(),
    supabase
      .from("scripture_memory_logs")
      .select("practice_date, memorized_new_count, reviewed_count")
      .eq("user_id", user.id)
      .gte("practice_date", recentStart)
      .lte("practice_date", todayYmd)
      .order("practice_date", { ascending: false }),
    supabase
      .from("scripture_memory_logs")
      .select("memorized_new_count")
      .eq("user_id", user.id)
      .gte("practice_date", monthStartYmd)
      .lte("practice_date", monthUpper),
  ]);

  const streakDays = scriptureMemoryDayStreakFromRows(allForStreak ?? [], todayYmd);

  let monthlyMemorized = 0;
  for (const r of monthRows ?? []) {
    monthlyMemorized += r.memorized_new_count ?? 0;
  }

  const today: ScriptureMemoryLogRow | null = todayRow
    ? {
        practice_date: String(todayRow.practice_date).slice(0, 10),
        memorized_new_count: todayRow.memorized_new_count ?? 0,
        reviewed_count: todayRow.reviewed_count ?? 0,
      }
    : null;

  const todayReviewed = today?.reviewed_count ?? 0;

  return {
    todayYmd,
    today,
    streakDays,
    recent: (recentRows ?? []).map((r) => ({
      practice_date: String(r.practice_date).slice(0, 10),
      memorized_new_count: r.memorized_new_count ?? 0,
      reviewed_count: r.reviewed_count ?? 0,
    })),
    settings,
    monthlyMemorized,
    monthStartYmd,
    monthEndYmd,
    todayReviewed,
    monthMeterRatio: clampMeterRatio(monthlyMemorized, settings.monthly_new_passages_goal),
    dayMeterRatio: clampMeterRatio(todayReviewed, settings.daily_review_goal),
  };
}

export async function upsertScriptureMemoryLog(input: {
  practiceDateYmd: string;
  memorizedNew: number;
  reviewed: number;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ensured = await ensureScriptureMemorySettings(supabase, user.id);
  if (!ensured.data) return { error: ensured.error ?? "Settings missing" };

  const d = input.practiceDateYmd.trim().slice(0, 10);
  const mem = Math.max(0, Math.floor(input.memorizedNew));
  const rev = Math.max(0, Math.floor(input.reviewed));

  const { data: prior } = await supabase
    .from("scripture_memory_logs")
    .select("memorized_new_count")
    .eq("user_id", user.id)
    .eq("practice_date", d)
    .maybeSingle();

  const oldMem = prior?.memorized_new_count ?? 0;
  const delta = mem - oldMem;

  const { error: upLog } = await supabase.from("scripture_memory_logs").upsert(
    {
      user_id: user.id,
      practice_date: d,
      memorized_new_count: mem,
      reviewed_count: rev,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,practice_date" }
  );

  if (upLog) return { error: upLog.message };

  if (delta !== 0) {
    const { data: row } = await supabase
      .from("scripture_memory_settings")
      .select("current_total_memorized")
      .eq("user_id", user.id)
      .single();

    const cur = row?.current_total_memorized ?? 0;
    const next = Math.max(0, cur + delta);
    const { error: upSet } = await supabase
      .from("scripture_memory_settings")
      .update({
        current_total_memorized: next,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (upSet) return { error: upSet.message };
  }

  revalidatePath("/app/scripture-memory");
  revalidatePath("/app");
  return { success: true };
}

export async function updateScriptureMemorySettings(input: {
  monthlyNewPassagesGoal: number;
  dailyReviewGoal: number;
  currentTotalMemorized: number;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const mg = Math.min(30, Math.max(1, Math.floor(input.monthlyNewPassagesGoal)));
  const dg = Math.min(30, Math.max(1, Math.floor(input.dailyReviewGoal)));
  const total = Math.max(0, Math.floor(input.currentTotalMemorized));

  await ensureScriptureMemorySettings(supabase, user.id);

  const { error } = await supabase
    .from("scripture_memory_settings")
    .update({
      monthly_new_passages_goal: mg,
      daily_review_goal: dg,
      current_total_memorized: total,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/scripture-memory");
  revalidatePath("/app");
  return { success: true };
}
