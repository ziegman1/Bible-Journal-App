"use server";

import { getChatReadingPaceBundle } from "@/app/actions/chat-reading-pace";
import { getPrayerWheelDashboardStats } from "@/app/actions/prayer-wheel";
import { listGroupsForUser } from "@/app/actions/groups";
import {
  BADWR_SHARE_WEEKLY_GOAL,
  BADWR_SOAPS_WEEKLY_GOAL,
  BADWR_PRAYER_MINUTES_WEEKLY_GOAL,
  buildChatPillar,
  buildPrayPillar,
  buildSharePillar,
  buildThirdsPillar,
  buildWordSoapsPillar,
  expectedReadingTouchesSoFar,
  overallReproductionPercent,
  type BadwrPillarModel,
} from "@/lib/dashboard/badwr-reproduction-model";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import {
  utcDateYmd,
  startOfUtcWeekMonday,
  endOfUtcWeekMonday,
  utcWeekDaysElapsedInclusive,
} from "@/lib/dashboard/utc-week";
import { expectedUnitsThroughWeek } from "@/lib/dashboard/weekly-rhythm-pace";
import { createClient } from "@/lib/supabase/server";

export type BadwrReproductionSnapshot = {
  overallPercent: number;
  pillars: BadwrPillarModel[];
  /** Pillars that most need work (lowest scores first, tier attention first) */
  focusAreas: BadwrPillarModel[];
  daysElapsed: number;
};

export async function getBadwrReproductionSnapshot(): Promise<
  { error: string } | BadwrReproductionSnapshot
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const now = new Date();
  const weekStart = startOfUtcWeekMonday(now);
  const weekEndDate = new Date(weekStart);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const startYmd = utcDateYmd(weekStart);
  const endYmd = utcDateYmd(weekEndDate);
  const startIso = weekStart.toISOString();
  const endIso = endOfUtcWeekMonday(now).toISOString();

  const daysElapsed = utcWeekDaysElapsedInclusive(now);

  const soapsExpectedSoFar = expectedUnitsThroughWeek(daysElapsed, BADWR_SOAPS_WEEKLY_GOAL);
  const prayerExpectedSoFar = expectedUnitsThroughWeek(daysElapsed, BADWR_PRAYER_MINUTES_WEEKLY_GOAL);
  const shareExpectedSoFar = expectedUnitsThroughWeek(daysElapsed, BADWR_SHARE_WEEKLY_GOAL);
  const readingExpectedSoFar = expectedReadingTouchesSoFar(daysElapsed);

  const thirdsResult = await listGroupsForUser({ groupKind: "thirds" });
  const thirdsGroupIds =
    "error" in thirdsResult ? [] : thirdsResult.groups.map((g) => g.id);
  const chatResult = await listGroupsForUser({ groupKind: "chat" });
  const chatGroupId =
    "error" in chatResult || !chatResult.groups[0] ? null : chatResult.groups[0].id;

  let meetingsWeek: { id: string }[] = [];
  if (thirdsGroupIds.length > 0) {
    const { data: mw } = await supabase
      .from("group_meetings")
      .select("id")
      .in("group_id", thirdsGroupIds)
      .eq("status", "completed")
      .gte("meeting_date", startYmd)
      .lte("meeting_date", endYmd);
    meetingsWeek = mw ?? [];
  }

  const [soapsRes, readingCountRes, prayerStats, shareCountRes, soloWeekRes, soloSettingsRes] =
    await Promise.all([
      supabase
        .from("journal_entries")
        .select("scripture_text, soaps_share, user_reflection, prayer, application")
        .eq("user_id", user.id)
        .gte("entry_date", startYmd)
        .lte("entry_date", endYmd),
      supabase
        .from("reading_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("read_at", startIso)
        .lte("read_at", endIso),
      getPrayerWheelDashboardStats(),
      supabase
        .from("share_encounters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("encounter_date", startYmd)
        .lte("encounter_date", endYmd),
      supabase
        .from("thirds_personal_weeks")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_monday", startYmd)
        .not("finalized_at", "is", null)
        .maybeSingle(),
      supabase
        .from("thirds_participation_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (soapsRes.error) return { error: soapsRes.error.message };
  if (readingCountRes.error) return { error: readingCountRes.error.message };
  if (shareCountRes.error) return { error: shareCountRes.error.message };
  if (soloWeekRes.error) return { error: soloWeekRes.error.message };
  if (soloSettingsRes.error) return { error: soloSettingsRes.error.message };

  const soapsActual = (soapsRes.data ?? []).filter((row) => isQualifyingSoapsEntry(row)).length;
  const readingActual = readingCountRes.count ?? 0;

  const weeklyMinutes = "error" in prayerStats ? 0 : prayerStats.weeklyMinutes;

  const shareActual = shareCountRes.count ?? 0;

  let attendedThirdsThisWeek = false;
  const meetingIds = meetingsWeek.map((m) => m.id);
  if (meetingIds.length > 0) {
    const { data: parts } = await supabase
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", user.id)
      .eq("present", true)
      .in("meeting_id", meetingIds);
    attendedThirdsThisWeek = (parts?.length ?? 0) > 0;
  }

  if (soloWeekRes.data) {
    attendedThirdsThisWeek = true;
  }

  const inThirdsGroup = thirdsGroupIds.length > 0 || soloSettingsRes.data != null;
  const inChatGroup = chatGroupId != null;

  let paceAheadOrOn = false;
  let paceRecoverable = false;
  if (chatGroupId) {
    const bundle = await getChatReadingPaceBundle(chatGroupId);
    if (!("error" in bundle)) {
      const { pace } = bundle;
      paceAheadOrOn = pace.status === "ahead" || pace.status === "on_pace";
      paceRecoverable = pace.status === "behind" && pace.delta >= -4;
    }
  }

  const pillars: BadwrPillarModel[] = [
    buildWordSoapsPillar({
      soapsActual,
      soapsExpectedSoFar,
      readingSessionsActual: readingActual,
      readingExpectedSoFar,
    }),
    buildPrayPillar({
      minutesActual: weeklyMinutes,
      minutesExpectedSoFar: prayerExpectedSoFar,
    }),
    buildChatPillar({
      inChatGroup,
      paceAheadOrOn,
      paceRecoverable,
      chatHref: chatGroupId ? `/app/chat/groups/${chatGroupId}` : "/app/chat",
    }),
    buildThirdsPillar({
      attendedCompletedThisWeek: attendedThirdsThisWeek,
      inThirdsGroup,
    }),
    buildSharePillar({
      shareActual,
      shareExpectedSoFar,
    }),
  ];

  const overallPercent = overallReproductionPercent(pillars);

  const tierOrder: Record<BadwrPillarModel["tier"], number> = {
    attention: 0,
    ok: 1,
    strong: 2,
  };
  const focusAreas = [...pillars]
    .sort((a, b) => {
      if (a.tier === b.tier) return a.score - b.score;
      return tierOrder[a.tier] - tierOrder[b.tier];
    })
    .filter((p) => p.tier !== "strong")
    .slice(0, 3);

  return {
    overallPercent,
    pillars,
    focusAreas,
    daysElapsed,
  };
}
