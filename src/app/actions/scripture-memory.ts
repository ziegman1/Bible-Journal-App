"use server";

import { revalidatePath } from "next/cache";
import {
  pillarTodayYmd,
  scriptureMemoryDayStreakFromRows,
} from "@/lib/dashboard/identity-streaks";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { createClient } from "@/lib/supabase/server";

export type ScriptureMemoryLogRow = {
  practice_date: string;
  memorized_new_count: number;
  reviewed_count: number;
};

export async function getScriptureMemoryStreakSummary(): Promise<{
  streakDays: number;
}> {
  const supabase = await createClient();
  if (!supabase) return { streakDays: 0 };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { streakDays: 0 };

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const todayYmd = pillarTodayYmd(now, tz);
  const oldestYmd = ymdAddCalendarDays(todayYmd, -800);

  const { data: rows } = await supabase
    .from("scripture_memory_logs")
    .select("practice_date, memorized_new_count, reviewed_count")
    .eq("user_id", user.id)
    .gte("practice_date", oldestYmd);

  const streak = scriptureMemoryDayStreakFromRows(rows ?? [], todayYmd);
  return { streakDays: streak };
}

export async function getScriptureMemoryPageData(): Promise<
  | { error: string }
  | {
      todayYmd: string;
      today: ScriptureMemoryLogRow | null;
      streakDays: number;
      recent: ScriptureMemoryLogRow[];
      totals: { memorized: number; reviewed: number };
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

  const [{ data: allForStreak }, { data: todayRow }, { data: recentRows }, { data: sumRows }] =
    await Promise.all([
      supabase
        .from("scripture_memory_logs")
        .select("practice_date, memorized_new_count, reviewed_count")
        .eq("user_id", user.id)
        .gte("practice_date", ymdAddCalendarDays(todayYmd, -800)),
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
        .select("memorized_new_count, reviewed_count")
        .eq("user_id", user.id),
    ]);

  const streakDays = scriptureMemoryDayStreakFromRows(allForStreak ?? [], todayYmd);

  let memorized = 0;
  let reviewed = 0;
  for (const r of sumRows ?? []) {
    memorized += r.memorized_new_count ?? 0;
    reviewed += r.reviewed_count ?? 0;
  }

  const today: ScriptureMemoryLogRow | null = todayRow
    ? {
        practice_date: String(todayRow.practice_date).slice(0, 10),
        memorized_new_count: todayRow.memorized_new_count ?? 0,
        reviewed_count: todayRow.reviewed_count ?? 0,
      }
    : null;

  return {
    todayYmd,
    today,
    streakDays,
    recent: (recentRows ?? []).map((r) => ({
      practice_date: String(r.practice_date).slice(0, 10),
      memorized_new_count: r.memorized_new_count ?? 0,
      reviewed_count: r.reviewed_count ?? 0,
    })),
    totals: { memorized, reviewed },
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

  const d = input.practiceDateYmd.trim().slice(0, 10);
  const mem = Math.max(0, Math.floor(input.memorizedNew));
  const rev = Math.max(0, Math.floor(input.reviewed));

  const { error } = await supabase.from("scripture_memory_logs").upsert(
    {
      user_id: user.id,
      practice_date: d,
      memorized_new_count: mem,
      reviewed_count: rev,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,practice_date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app/scripture-memory");
  revalidatePath("/app");
  return { success: true };
}
