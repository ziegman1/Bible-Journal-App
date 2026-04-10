"use server";

import { listGroupsForUser } from "@/app/actions/groups";
import {
  buildPrayerMinutesByPillarDay,
  buildSoapsQualifyingDaySet,
  consecutiveDayStreak,
  pillarTodayYmd,
  prayerStreakFromDailyMinutes,
  scriptureMemoryDayStreakFromRows,
  shareStreakFromEncounterDates,
} from "@/lib/dashboard/identity-streaks";
import { consecutivePillarWeekStreak } from "@/lib/dashboard/pillar-week-streak";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { createClient } from "@/lib/supabase/server";

export type IdentityStreakStat = { label: string; value: string };

const LOOKBACK_DAYS = 800;

function formatDayStreak(n: number): string {
  if (n <= 0) return "0 days";
  return n === 1 ? "1 day" : `${n} days`;
}

function formatWeekStreak(n: number): string {
  if (n <= 0) return "0 weeks";
  return n === 1 ? "1 week" : `${n} weeks`;
}

/**
 * Dashboard ME / BADWR card: daily SOAPS, prayer, share, Scripture Memory + weekly 3/3 + CHAT.
 */
export async function getIdentityStreakStats(): Promise<IdentityStreakStat[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [
      { label: "SOAPS streak", value: "—" },
      { label: "Prayer streak", value: "—" },
      { label: "Share streak", value: "—" },
      { label: "Scripture Memory streak", value: "—" },
      { label: "3/3 weekly streak", value: "—" },
      { label: "CHAT weekly streak", value: "—" },
    ];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [
      { label: "SOAPS streak", value: "—" },
      { label: "Prayer streak", value: "—" },
      { label: "Share streak", value: "—" },
      { label: "Scripture Memory streak", value: "—" },
      { label: "3/3 weekly streak", value: "—" },
      { label: "CHAT weekly streak", value: "—" },
    ];
  }

  const tz = await getPracticeTimeZone();
  const now = new Date();
  const todayYmd = pillarTodayYmd(now, tz);
  const oldestYmd = ymdAddCalendarDays(todayYmd, -LOOKBACK_DAYS);
  const oldestIso = `${oldestYmd}T00:00:00.000Z`;

  const thirdsResult = await listGroupsForUser({ groupKind: "thirds" });
  const chatResult = await listGroupsForUser({ groupKind: "chat" });
  const thirdsGroupIds =
    "error" in thirdsResult ? [] : thirdsResult.groups.map((g) => g.id);
  const chatGroupIds =
    "error" in chatResult ? [] : chatResult.groups.map((g) => g.id);

  const [
    journalRes,
    wheelRes,
    extraRes,
    shareRes,
    scriptureRes,
    pillarThirdsRes,
    chatCheckInsRes,
  ] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(
        "entry_date, scripture_text, soaps_share, user_reflection, prayer, application"
      )
      .eq("user_id", user.id)
      .gte("entry_date", oldestYmd),
    supabase
      .from("prayer_wheel_segment_completions")
      .select("completed_at, duration_minutes")
      .eq("user_id", user.id)
      .gte("completed_at", oldestIso),
    supabase
      .from("prayer_extra_minutes")
      .select("logged_at, minutes")
      .eq("user_id", user.id)
      .gte("logged_at", oldestIso),
    supabase
      .from("share_encounters")
      .select("encounter_date")
      .eq("user_id", user.id)
      .gte("encounter_date", oldestYmd),
    supabase
      .from("scripture_memory_logs")
      .select("practice_date, memorized_new_count, reviewed_count")
      .eq("user_id", user.id)
      .gte("practice_date", oldestYmd),
    supabase
      .from("pillar_week_streak_completions")
      .select("pillar_week_start_ymd")
      .eq("user_id", user.id),
    chatGroupIds.length === 0
      ? Promise.resolve({ data: [] as { week_start_ymd: string }[], error: null })
      : supabase
          .from("chat_reading_check_ins")
          .select("week_start_ymd")
          .eq("user_id", user.id)
          .in("group_id", chatGroupIds),
  ]);

  const soapsDays = buildSoapsQualifyingDaySet(journalRes.data ?? []);
  const soapsStreak = consecutiveDayStreak((d) => soapsDays.has(d), todayYmd);

  const prayerByDay = buildPrayerMinutesByPillarDay(
    wheelRes.data ?? [],
    extraRes.data ?? [],
    tz
  );
  const prayerStreak = prayerStreakFromDailyMinutes(prayerByDay, todayYmd);

  const shareStreak = shareStreakFromEncounterDates(
    (shareRes.data ?? []).map((r) => r.encounter_date),
    todayYmd
  );

  const scriptureRows = scriptureRes.error ? [] : (scriptureRes.data ?? []);
  const scriptureStreak = scriptureMemoryDayStreakFromRows(scriptureRows, todayYmd);

  const pillarRows = pillarThirdsRes.error ? [] : (pillarThirdsRes.data ?? []);
  const thirdsWeeks = new Set(
    pillarRows.map((r) => String(r.pillar_week_start_ymd).slice(0, 10))
  );
  const thirdsWeekly = consecutivePillarWeekStreak(thirdsWeeks, now, tz);

  const chatCheckData = chatCheckInsRes.error ? [] : (chatCheckInsRes.data ?? []);
  const chatWeekKeys = new Set(
    chatCheckData.map((r) => String(r.week_start_ymd).slice(0, 10))
  );
  const chatWeekly = consecutivePillarWeekStreak(chatWeekKeys, now, tz);

  let thirdsLabel = formatWeekStreak(thirdsWeekly);
  if (thirdsGroupIds.length === 0 && thirdsWeekly === 0) {
    thirdsLabel = "Join a 3/3rds group";
  }

  let chatLabel = formatWeekStreak(chatWeekly);
  if (chatGroupIds.length === 0 && chatWeekly === 0) {
    chatLabel = "Join CHAT";
  }

  return [
    { label: "SOAPS streak", value: formatDayStreak(soapsStreak) },
    { label: "Prayer streak", value: formatDayStreak(prayerStreak) },
    { label: "Share streak", value: formatDayStreak(shareStreak) },
    { label: "Scripture Memory streak", value: formatDayStreak(scriptureStreak) },
    { label: "3/3 weekly streak", value: thirdsLabel },
    { label: "CHAT weekly streak", value: chatLabel },
  ];
}
