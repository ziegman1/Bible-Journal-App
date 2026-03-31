"use server";

import { listGroupsForUser } from "@/app/actions/groups";
import {
  buildPrayerMinutesByPillarDay,
  buildSoapsQualifyingDaySet,
  consecutiveDayStreak,
  pillarTodayYmd,
  prayerStreakFromDailyMinutes,
  shareStreakFromEncounterDates,
  thirdsChatWeeklyStreak,
  type MeetingAttendanceRow,
} from "@/lib/dashboard/identity-streaks";
import { ymdAddCalendarDays } from "@/lib/dashboard/pillar-week";
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
 * Dashboard ME / BADWR card: SOAPS, prayer, share day streaks + 3/3rds+CHAT week streak.
 */
export async function getIdentityStreakStats(): Promise<IdentityStreakStat[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [
      { label: "SOAPS streak", value: "—" },
      { label: "Prayer streak", value: "—" },
      { label: "Share streak", value: "—" },
      { label: "3/3 + CHAT week streak", value: "—" },
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
      { label: "3/3 + CHAT week streak", value: "—" },
    ];
  }

  const now = new Date();
  const todayYmd = pillarTodayYmd(now);
  const oldestYmd = ymdAddCalendarDays(todayYmd, -LOOKBACK_DAYS);
  const oldestIso = `${oldestYmd}T00:00:00.000Z`;

  const thirdsResult = await listGroupsForUser({ groupKind: "thirds" });
  const chatResult = await listGroupsForUser({ groupKind: "chat" });
  const thirdsGroupIds =
    "error" in thirdsResult ? [] : thirdsResult.groups.map((g) => g.id);
  const chatGroupId =
    "error" in chatResult || !chatResult.groups[0] ? null : chatResult.groups[0].id;

  const memberGroupIds = [...thirdsGroupIds, ...(chatGroupId ? [chatGroupId] : [])];

  const [journalRes, wheelRes, extraRes, shareRes, meetingsRes] = await Promise.all([
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
    memberGroupIds.length === 0
      ? Promise.resolve({
          data: [] as MeetingAttendanceRow[],
          error: null,
        })
      : supabase
          .from("group_meetings")
          .select("id, group_id, meeting_date, status")
          .in("group_id", memberGroupIds)
          .eq("status", "completed"),
  ]);

  type MeetingRow = {
    id: string;
    group_id: string;
    meeting_date: string;
    status: string;
  };
  const meetingsRaw = (meetingsRes.data ?? []) as MeetingRow[];
  const meetingRowsForStreak: MeetingAttendanceRow[] = meetingsRaw.map((m) => ({
    meeting_id: m.id,
    group_id: m.group_id,
    meeting_date: m.meeting_date,
    status: m.status,
  }));
  const meetingIds = meetingsRaw.map((m) => m.id);

  let attendedIds = new Set<string>();
  if (meetingIds.length > 0) {
    const { data: parts, error: pErr } = await supabase
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", user.id)
      .eq("present", true)
      .in("meeting_id", meetingIds);
    if (!pErr && parts) {
      attendedIds = new Set(parts.map((p) => p.meeting_id));
    }
  }

  const soapsDays = buildSoapsQualifyingDaySet(journalRes.data ?? []);
  const soapsStreak = consecutiveDayStreak((d) => soapsDays.has(d), todayYmd);

  const prayerByDay = buildPrayerMinutesByPillarDay(
    wheelRes.data ?? [],
    extraRes.data ?? []
  );
  const prayerStreak = prayerStreakFromDailyMinutes(prayerByDay, todayYmd);

  const shareStreak = shareStreakFromEncounterDates(
    (shareRes.data ?? []).map((r) => r.encounter_date),
    todayYmd
  );

  const weekStreak = thirdsChatWeeklyStreak({
    now,
    thirdsGroupIds,
    chatGroupId,
    meetings: meetingRowsForStreak,
    attendedMeetingIds: attendedIds,
  });

  let weekLabelValue = formatWeekStreak(weekStreak);
  if (thirdsGroupIds.length === 0 || !chatGroupId) {
    weekLabelValue = "Join 3/3 + CHAT";
  }

  return [
    { label: "SOAPS streak", value: formatDayStreak(soapsStreak) },
    {
      label: "Prayer streak",
      value: formatDayStreak(prayerStreak),
    },
    { label: "Share streak", value: formatDayStreak(shareStreak) },
    { label: "3/3 + CHAT week streak", value: weekLabelValue },
  ];
}
