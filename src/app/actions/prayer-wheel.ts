"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { getMetricsAnchorWindow } from "@/lib/dashboard/metrics-anchor-window";
import {
  pillarTodayYmd,
  prayerStreakFromQualifyingDays,
} from "@/lib/dashboard/identity-streaks";
import { pillarWeekRangeForQuery, ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";
import {
  buildPrayerQualifyingDaySet,
  countQualifyingDaysInWindow,
  isoToPracticeYmd,
  longestPrayerStreakInDaySet,
} from "@/lib/prayer/activity";
import { buildPrayerWeeklyCompletionPace } from "@/lib/prayer-wheel/prayer-completion-pace";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import type { SupabaseClient } from "@supabase/supabase-js";

const LOOKBACK_DAYS_LOG = 800;

async function upsertPrayerDailyCompletion(
  supabase: SupabaseClient,
  userId: string,
  practiceDateYmd: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("prayer_daily_completions").upsert(
    { user_id: userId, practice_date: practiceDateYmd, updated_at: nowIso },
    { onConflict: "user_id,practice_date" }
  );
  if (error) {
    console.error("[prayer_daily_completions]", error.message);
  }
}

export type PrayerDashboardPracticeStats = {
  streak: number;
  prayedToday: boolean;
  daysWithPrayerThisWeek: number;
  paceDayIndex: number;
  onboardingPaceWeek: boolean;
  pace: ReturnType<typeof buildPrayerWeeklyCompletionPace>;
};

/** Streak + completion rhythm (days with prayer / week) for the dashboard prayer card. */
export async function getPrayerDashboardPracticeStats(): Promise<
  { error: string } | PrayerDashboardPracticeStats
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
  const anchor = getMetricsAnchorWindow(user.created_at, now, tz);
  const { startIso, endExclusiveIso } = anchor;
  const windowEndCap =
    todayYmd < anchor.queryEndYmdInclusive ? todayYmd : anchor.queryEndYmdInclusive;

  const oldestYmd = ymdAddCalendarDays(todayYmd, -LOOKBACK_DAYS_LOG);
  const oldestIso = `${oldestYmd}T00:00:00.000Z`;

  const [winWheel, winExtra, winFree, streakWheel, streakExtra, streakFree] = await Promise.all([
    supabase
      .from("prayer_wheel_segment_completions")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", startIso)
      .lt("completed_at", endExclusiveIso),
    supabase
      .from("prayer_extra_minutes")
      .select("logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", startIso)
      .lt("logged_at", endExclusiveIso),
    supabase
      .from("freestyle_prayer_sessions")
      .select("ended_at")
      .eq("user_id", user.id)
      .gte("ended_at", startIso)
      .lt("ended_at", endExclusiveIso),
    supabase
      .from("prayer_wheel_segment_completions")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", oldestIso),
    supabase
      .from("prayer_extra_minutes")
      .select("logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", oldestIso),
    supabase
      .from("freestyle_prayer_sessions")
      .select("ended_at")
      .eq("user_id", user.id)
      .gte("ended_at", oldestIso),
  ]);

  const err =
    winWheel.error || winExtra.error || streakWheel.error || streakExtra.error;
  if (err) return { error: err.message };

  const windowSet = buildPrayerQualifyingDaySet(
    winWheel.data ?? [],
    winExtra.data ?? [],
    winFree.error ? [] : (winFree.data ?? []),
    tz
  );
  const daysWithPrayerThisWeek = countQualifyingDaysInWindow(
    windowSet,
    anchor.queryStartYmd,
    windowEndCap
  );

  const streakSet = buildPrayerQualifyingDaySet(
    streakWheel.data ?? [],
    streakExtra.data ?? [],
    streakFree.error ? [] : (streakFree.data ?? []),
    tz
  );
  const streak = prayerStreakFromQualifyingDays(streakSet, todayYmd);
  const prayedToday = streakSet.has(todayYmd);

  const pace = buildPrayerWeeklyCompletionPace(daysWithPrayerThisWeek, now, tz, {
    anchorDayIndex: anchor.dayIndex,
    onboardingFirstWeek: anchor.mode === "onboarding",
  });

  return {
    streak,
    prayedToday,
    daysWithPrayerThisWeek,
    paceDayIndex: anchor.dayIndex,
    onboardingPaceWeek: anchor.mode === "onboarding",
    pace,
  };
}

export type PrayerActivityLogRow =
  | {
      kind: "wheel";
      atIso: string;
      stepIndex: number;
      durationMinutes: number;
    }
  | {
      kind: "extra";
      atIso: string;
      minutes: number;
    }
  | {
      kind: "freestyle";
      atIso: string;
      durationSeconds: number;
      note: string | null;
    };

export type PrayerActivityLogPageData = {
  streak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutesRounded: number;
  recent: PrayerActivityLogRow[];
};

export async function getPrayerActivityLogPageData(): Promise<
  { error: string } | PrayerActivityLogPageData
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
  const oldestYmd = ymdAddCalendarDays(todayYmd, -LOOKBACK_DAYS_LOG);
  const oldestIso = `${oldestYmd}T00:00:00.000Z`;
  const recentCutoffYmd = ymdAddCalendarDays(todayYmd, -30);

  const [wheelRes, extraRes, freeRes] = await Promise.all([
    supabase
      .from("prayer_wheel_segment_completions")
      .select("completed_at, step_index, duration_minutes")
      .eq("user_id", user.id)
      .gte("completed_at", oldestIso)
      .order("completed_at", { ascending: false })
      .limit(400),
    supabase
      .from("prayer_extra_minutes")
      .select("logged_at, minutes")
      .eq("user_id", user.id)
      .gte("logged_at", oldestIso)
      .order("logged_at", { ascending: false })
      .limit(400),
    supabase
      .from("freestyle_prayer_sessions")
      .select("ended_at, duration_seconds, note")
      .eq("user_id", user.id)
      .gte("ended_at", oldestIso)
      .order("ended_at", { ascending: false })
      .limit(200),
  ]);

  if (wheelRes.error) return { error: wheelRes.error.message };
  if (extraRes.error) return { error: extraRes.error.message };

  const freeRowsSafe = freeRes.error ? [] : (freeRes.data ?? []);

  const streakSet = buildPrayerQualifyingDaySet(
    wheelRes.data ?? [],
    extraRes.data ?? [],
    freeRowsSafe,
    tz
  );
  const streak = prayerStreakFromQualifyingDays(streakSet, todayYmd);
  const longestStreak = longestPrayerStreakInDaySet(streakSet);

  const wheelRows = wheelRes.data ?? [];
  const extraRows = extraRes.data ?? [];
  const freeRows = freeRowsSafe;

  const totalSessions = wheelRows.length + extraRows.length + freeRows.length;
  let totalMinutes = 0;
  for (const r of wheelRows) totalMinutes += r.duration_minutes ?? 0;
  for (const r of extraRows) totalMinutes += r.minutes ?? 0;
  for (const r of freeRows) totalMinutes += (r.duration_seconds ?? 0) / 60;
  const totalMinutesRounded = Math.round(totalMinutes * 10) / 10;

  const merged: PrayerActivityLogRow[] = [
    ...wheelRows.map((r) => ({
      kind: "wheel" as const,
      atIso: r.completed_at,
      stepIndex: r.step_index,
      durationMinutes: r.duration_minutes ?? 0,
    })),
    ...extraRows.map((r) => ({
      kind: "extra" as const,
      atIso: r.logged_at,
      minutes: r.minutes ?? 0,
    })),
    ...freeRows.map((r) => ({
      kind: "freestyle" as const,
      atIso: r.ended_at,
      durationSeconds: r.duration_seconds,
      note: r.note,
    })),
  ];

  merged.sort((a, b) => (a.atIso < b.atIso ? 1 : a.atIso > b.atIso ? -1 : 0));

  const recent = merged.filter((row) => {
    const d = isoToPracticeYmd(row.atIso, tz);
    return d >= recentCutoffYmd;
  }).slice(0, 40);

  return {
    streak,
    longestStreak,
    totalSessions,
    totalMinutesRounded,
    recent,
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

  const tz = await getPracticeTimeZone();
  const ymd = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  await upsertPrayerDailyCompletion(supabase, user.id, ymd);

  revalidatePath("/app");
  revalidatePath("/app/prayer/log");
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

  const tz = await getPracticeTimeZone();
  const ymd = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  await upsertPrayerDailyCompletion(supabase, user.id, ymd);

  revalidatePath("/app");
  revalidatePath("/app/prayer/log");
  /* Omit /app/prayer — revalidating it can remount PrayerWheelTimer and cancel transition audio. */
  return { success: true };
}

/** Completed freestyle timer session — qualifies the day and appears in the prayer log. */
export async function recordFreestylePrayerSession(
  durationSeconds: number,
  note?: string | null
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const sec = Math.floor(durationSeconds);
  if (!Number.isFinite(sec) || sec < 1 || sec > 86400) {
    return { error: "Invalid duration" };
  }

  const tz = await getPracticeTimeZone();
  const endedAt = new Date();
  const practiceDateYmd = formatInTimeZone(endedAt, tz, "yyyy-MM-dd");

  const trimmed =
    typeof note === "string" ? note.trim().slice(0, 2000) : "";
  const noteVal = trimmed.length > 0 ? trimmed : null;

  const { error } = await supabase.from("freestyle_prayer_sessions").insert({
    user_id: user.id,
    practice_date: practiceDateYmd,
    duration_seconds: sec,
    ended_at: endedAt.toISOString(),
    note: noteVal,
  });

  if (error) return { error: error.message };

  await upsertPrayerDailyCompletion(supabase, user.id, practiceDateYmd);

  revalidatePath("/app");
  revalidatePath("/app/prayer/log");
  return { success: true as const };
}

/** Removes all Prayer Wheel segment completions and extra minutes for the current pillar week (see `pillar-week.ts`). */
export async function resetThisWeeksPrayerTime(): Promise<
  | { error: string }
  | {
      success: true;
      removedWheelSegments: number;
      removedExtraEntries: number;
      removedFreestyleSessions: number;
      removedDailyCompletions: number;
    }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const { startIso, endExclusiveIso, startYmd, endYmdInclusive } =
    pillarWeekRangeForQuery(new Date(), tz);

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

  const { data: freeRemoved, error: freeErr } = await supabase
    .from("freestyle_prayer_sessions")
    .delete()
    .eq("user_id", user.id)
    .gte("ended_at", startIso)
    .lt("ended_at", endExclusiveIso)
    .select("id");

  if (freeErr) return { error: freeErr.message };

  const { data: dailyRemoved, error: dailyErr } = await supabase
    .from("prayer_daily_completions")
    .delete()
    .eq("user_id", user.id)
    .gte("practice_date", startYmd)
    .lte("practice_date", endYmdInclusive)
    .select("practice_date");

  if (dailyErr) return { error: dailyErr.message };

  revalidatePath("/app");
  revalidatePath("/app/prayer");
  revalidatePath("/app/prayer/log");

  return {
    success: true,
    removedWheelSegments: segRemoved?.length ?? 0,
    removedExtraEntries: extraRemoved?.length ?? 0,
    removedFreestyleSessions: freeRemoved?.length ?? 0,
    removedDailyCompletions: dailyRemoved?.length ?? 0,
  };
}
