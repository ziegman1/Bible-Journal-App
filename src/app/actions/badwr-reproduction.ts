"use server";

import { getChatReadingPaceBundle } from "@/app/actions/chat-reading-pace";
import { listGroupsForUser } from "@/app/actions/groups";
import {
  BADWR_SOAPS_WEEKLY_GOAL,
  buildChatPillar,
  buildPrayPillar,
  buildSharePillar,
  buildThirdsPillar,
  buildWordSoapsPillar,
  expectedReadingTouchesForPaceDay,
  overallReproductionPercent,
  type BadwrPillarModel,
} from "@/lib/dashboard/badwr-reproduction-model";
import {
  applyThirdsParticipationWeeksAdjust,
  parseBadwrReproductionCountAdjustments,
} from "@/lib/dashboard/badwr-reproduction-count-adjustments";
import {
  computeCumulativeBadwr,
  emptyBucket,
  mergeCumulativeIntoWeeklyTemplates,
  type WeekRhythmBucket,
} from "@/lib/dashboard/badwr-reproduction-cumulative";
import { getMetricsAnchorWindow } from "@/lib/dashboard/metrics-anchor-window";
import {
  enumeratePillarWeekStartYmids,
  pillarWeekRangeForQuery,
  pillarWeekStartKeyFromDateYmd,
  pillarWeekStartKeyFromInstant,
  ymdAddCalendarDays,
  ymdRangesOverlap,
} from "@/lib/dashboard/pillar-week";
import { isQualifyingSoapsEntry } from "@/lib/dashboard/soaps-entry";
import {
  expectedUnitsForPaceDay,
} from "@/lib/dashboard/weekly-rhythm-pace";
import { fetchThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { formatInTimeZone } from "date-fns-tz";

export type BadwrReproductionSnapshot = {
  overallPercent: number;
  pillars: BadwrPillarModel[];
  /** Pillars that most need work (lowest scores first, tier attention first) */
  focusAreas: BadwrPillarModel[];
  daysElapsed: number;
};

function bumpBucket(
  map: Map<string, WeekRhythmBucket>,
  weekKey: string,
  patch: Partial<WeekRhythmBucket>
) {
  const c = map.get(weekKey) ?? emptyBucket();
  map.set(weekKey, {
    soapsQualifying: c.soapsQualifying + (patch.soapsQualifying ?? 0),
    readingSessions: c.readingSessions + (patch.readingSessions ?? 0),
    prayerMinutes: c.prayerMinutes + (patch.prayerMinutes ?? 0),
    shares: c.shares + (patch.shares ?? 0),
  });
}

function touchEarliest(e: string | null | undefined, ref: { min: string | null }) {
  if (!e) return;
  const d = e.slice(0, 10);
  if (!ref.min || d < ref.min) ref.min = d;
}

/** Legacy %-of-goal cumulative BADWR snapshot — still used by settings adjustments / `BadwrReproductionCard` if re-mounted; home dashboard uses formation-momentum instead. */
export async function getBadwrReproductionSnapshot(): Promise<
  { error: string } | BadwrReproductionSnapshot
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [{ shareWeeklyGoalEncounters, prayerWeeklyGoalMinutes }, tz] = await Promise.all([
    fetchUserRhythmGoals(supabase, user.id),
    getPracticeTimeZone(),
  ]);
  const now = new Date();
  const pillar = pillarWeekRangeForQuery(now, tz);
  const anchor = getMetricsAnchorWindow(user.created_at, now, tz);
  const rhythmStartYmd = anchor.queryStartYmd;
  const rhythmEndYmd = anchor.queryEndYmdInclusive;
  const { startIso, endExclusiveIso } = anchor;

  const daysElapsed = anchor.dayIndex;
  const onboardingPace = anchor.mode === "onboarding";

  const soapsExpectedSoFar = expectedUnitsForPaceDay(daysElapsed, BADWR_SOAPS_WEEKLY_GOAL, {
    onboardingFirstDayZero: onboardingPace,
  });
  const prayerExpectedSoFar = expectedUnitsForPaceDay(daysElapsed, prayerWeeklyGoalMinutes, {
    onboardingFirstDayZero: onboardingPace,
  });
  const shareExpectedSoFar = expectedUnitsForPaceDay(daysElapsed, shareWeeklyGoalEncounters, {
    onboardingFirstDayZero: onboardingPace,
  });
  const readingExpectedSoFar = expectedReadingTouchesForPaceDay(daysElapsed, {
    onboardingFirstDayZero: onboardingPace,
  });

  const thirdsResult = await listGroupsForUser({ groupKind: "thirds" });
  const thirdsGroupIds =
    "error" in thirdsResult ? [] : thirdsResult.groups.map((g) => g.id);
  const chatResult = await listGroupsForUser({ groupKind: "chat" });
  const chatGroupId =
    "error" in chatResult || !chatResult.groups[0] ? null : chatResult.groups[0].id;

  let meetingsWeek: { id: string }[] = [];
  let allCompletedMeetings: { id: string; meeting_date: string }[] = [];
  if (thirdsGroupIds.length > 0) {
    const [{ data: mw }, { data: allM }] = await Promise.all([
      supabase
        .from("group_meetings")
        .select("id")
        .in("group_id", thirdsGroupIds)
        .eq("status", "completed")
        .gte("meeting_date", pillar.startYmd)
        .lte("meeting_date", pillar.endYmdInclusive),
      supabase
        .from("group_meetings")
        .select("id, meeting_date")
        .in("group_id", thirdsGroupIds)
        .eq("status", "completed"),
    ]);
    meetingsWeek = mw ?? [];
    allCompletedMeetings = allM ?? [];
  }

  const memberGroupIds = [...thirdsGroupIds];
  if (chatGroupId) memberGroupIds.push(chatGroupId);

  const [
    soapsRes,
    journalAllRes,
    readingWeekCountRes,
    readingAllRes,
    prayerSegRes,
    prayerExtraRes,
    shareWeekCountRes,
    shareAllRes,
    soloWeekRes,
    soloFinalizedRes,
    participationRes,
    membershipsRes,
    thirdsParticipationMetrics,
    attendedAllMeetingsRes,
    reproductionCountAdjRes,
  ] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("scripture_text, soaps_share, user_reflection, prayer, application")
      .eq("user_id", user.id)
      .gte("entry_date", rhythmStartYmd)
      .lte("entry_date", rhythmEndYmd),
    supabase
      .from("journal_entries")
      .select("entry_date, scripture_text, soaps_share, user_reflection, prayer, application")
      .eq("user_id", user.id),
    supabase
      .from("reading_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("read_at", startIso)
      .lt("read_at", endExclusiveIso),
    supabase.from("reading_sessions").select("read_at").eq("user_id", user.id),
    supabase
      .from("prayer_wheel_segment_completions")
      .select("completed_at, duration_minutes")
      .eq("user_id", user.id),
    supabase
      .from("prayer_extra_minutes")
      .select("logged_at, minutes")
      .eq("user_id", user.id),
    supabase
      .from("share_encounters")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("encounter_date", rhythmStartYmd)
      .lte("encounter_date", rhythmEndYmd),
    supabase.from("share_encounters").select("encounter_date").eq("user_id", user.id),
    supabase
      .from("thirds_personal_weeks")
      .select("week_start_monday")
      .eq("user_id", user.id)
      .not("finalized_at", "is", null)
      .gte("week_start_monday", ymdAddCalendarDays(pillar.startYmd, -6))
      .lte("week_start_monday", pillar.endYmdInclusive),
    supabase
      .from("thirds_personal_weeks")
      .select("week_start_monday")
      .eq("user_id", user.id)
      .not("finalized_at", "is", null),
    supabase
      .from("thirds_participation_settings")
      .select("participation_started_on")
      .eq("user_id", user.id)
      .maybeSingle(),
    memberGroupIds.length === 0
      ? Promise.resolve({
          data: [] as { joined_at: string; group_id: string }[],
          error: null,
        })
      : supabase
          .from("group_members")
          .select("joined_at, group_id")
          .eq("user_id", user.id)
          .in("group_id", memberGroupIds),
    fetchThirdsParticipationMetrics(supabase, user.id),
    allCompletedMeetings.length > 0
      ? supabase
          .from("meeting_participants")
          .select("meeting_id")
          .eq("user_id", user.id)
          .eq("present", true)
          .in(
            "meeting_id",
            allCompletedMeetings.map((m) => m.id)
          )
      : Promise.resolve({ data: [] as { meeting_id: string }[], error: null }),
    supabase
      .from("profiles")
      .select("badwr_reproduction_count_adjustments")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (reproductionCountAdjRes.error) {
    return { error: reproductionCountAdjRes.error.message };
  }

  if (soapsRes.error) return { error: soapsRes.error.message };
  if (readingWeekCountRes.error) return { error: readingWeekCountRes.error.message };
  if (journalAllRes.error) return { error: journalAllRes.error.message };
  if (readingAllRes.error) return { error: readingAllRes.error.message };

  const soapsActual = (soapsRes.data ?? []).filter((row) => isQualifyingSoapsEntry(row)).length;
  const readingActual = readingWeekCountRes.count ?? 0;

  const weeklyPrayerMinutes = (() => {
    let m = 0;
    for (const row of prayerSegRes.data ?? []) {
      const iso = row.completed_at;
      if (!iso || iso < startIso || iso >= endExclusiveIso) continue;
      m += row.duration_minutes ?? 0;
    }
    for (const row of prayerExtraRes.data ?? []) {
      const iso = row.logged_at;
      if (!iso || iso < startIso || iso >= endExclusiveIso) continue;
      m += row.minutes ?? 0;
    }
    return m;
  })();

  const shareActual = shareWeekCountRes.error ? 0 : (shareWeekCountRes.count ?? 0);
  const soloCandidates = soloWeekRes.error ? [] : (soloWeekRes.data ?? []);
  const soloWeekRow = soloCandidates.find((r) => {
    const m = r.week_start_monday.slice(0, 10);
    const soloEnd = ymdAddCalendarDays(m, 6);
    return ymdRangesOverlap(m, soloEnd, pillar.startYmd, pillar.endYmdInclusive);
  });
  const soloSettingsRow =
    !participationRes.error && participationRes.data ? participationRes.data : null;

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

  if (soloWeekRow) {
    attendedThirdsThisWeek = true;
  }

  const inThirdsGroup = thirdsGroupIds.length > 0 || soloSettingsRow !== null;
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

  const countAdjustments = parseBadwrReproductionCountAdjustments(
    reproductionCountAdjRes.data?.badwr_reproduction_count_adjustments
  );
  const thirdsParticipationForWeeklyHints = applyThirdsParticipationWeeksAdjust(
    thirdsParticipationMetrics,
    countAdjustments.thirds_meeting_weeks ?? 0
  );

  const weeklyPillars: BadwrPillarModel[] = [
    buildWordSoapsPillar({
      soapsActual,
      soapsExpectedSoFar,
      readingSessionsActual: readingActual,
      readingExpectedSoFar,
    }),
    buildPrayPillar({
      minutesActual: weeklyPrayerMinutes,
      minutesExpectedSoFar: prayerExpectedSoFar,
      weeklyPrayerGoalMinutes: prayerWeeklyGoalMinutes,
    }),
    buildChatPillar({
      inChatGroup,
      paceAheadOrOn,
      paceRecoverable,
      chatHref: chatGroupId ? `/app/chat/groups/${chatGroupId}` : "/app/chat",
      onboardingPaceEase: onboardingPace,
    }),
    buildThirdsPillar({
      attendedCompletedThisWeek: attendedThirdsThisWeek,
      inThirdsGroup,
      participationMetrics: thirdsParticipationForWeeklyHints,
      onboardingPaceEase: onboardingPace,
    }),
    buildSharePillar({
      shareActual,
      shareExpectedSoFar,
      weeklyShareGoalEncounters: shareWeeklyGoalEncounters,
    }),
  ];

  const earliest: { min: string | null } = { min: null };
  if (user.created_at) {
    touchEarliest(
      formatInTimeZone(new Date(user.created_at), tz, "yyyy-MM-dd"),
      earliest
    );
  }

  const buckets = new Map<string, WeekRhythmBucket>();

  for (const row of journalAllRes.data ?? []) {
    touchEarliest(row.entry_date, earliest);
    const wk = pillarWeekStartKeyFromDateYmd(row.entry_date, tz);
    if (isQualifyingSoapsEntry(row)) {
      bumpBucket(buckets, wk, { soapsQualifying: 1 });
    }
  }

  for (const row of readingAllRes.data ?? []) {
    const iso = row.read_at;
    if (!iso) continue;
    touchEarliest(iso, earliest);
    const wk = pillarWeekStartKeyFromInstant(new Date(iso), tz);
    bumpBucket(buckets, wk, { readingSessions: 1 });
  }

  for (const row of prayerSegRes.data ?? []) {
    const iso = row.completed_at;
    if (!iso) continue;
    touchEarliest(iso, earliest);
    const wk = pillarWeekStartKeyFromInstant(new Date(iso), tz);
    bumpBucket(buckets, wk, { prayerMinutes: row.duration_minutes ?? 0 });
  }

  for (const row of prayerExtraRes.data ?? []) {
    const iso = row.logged_at;
    if (!iso) continue;
    touchEarliest(iso, earliest);
    const wk = pillarWeekStartKeyFromInstant(new Date(iso), tz);
    bumpBucket(buckets, wk, { prayerMinutes: row.minutes ?? 0 });
  }

  for (const row of shareAllRes.data ?? []) {
    const ymd = row.encounter_date;
    if (!ymd) continue;
    touchEarliest(ymd, earliest);
    const wk = pillarWeekStartKeyFromDateYmd(ymd, tz);
    bumpBucket(buckets, wk, { shares: 1 });
  }

  for (const row of soloFinalizedRes.data ?? []) {
    touchEarliest(row.week_start_monday, earliest);
  }

  let chatEngagedWeekStartYmd: string | null = null;
  let thirdsGroupFirstJoinedCalendarYmd: string | null = null;
  const participationStartedYmd =
    participationRes.data?.participation_started_on != null
      ? String(participationRes.data.participation_started_on).slice(0, 10)
      : null;

  if (!membershipsRes.error && membershipsRes.data) {
    for (const m of membershipsRes.data) {
      const joined = m.joined_at;
      if (!joined) continue;
      touchEarliest(joined, earliest);
      const pillar = pillarWeekStartKeyFromInstant(new Date(joined), tz);
      const calYmd = joined.slice(0, 10);
      if (chatGroupId && m.group_id === chatGroupId) {
        if (!chatEngagedWeekStartYmd || pillar < chatEngagedWeekStartYmd) {
          chatEngagedWeekStartYmd = pillar;
        }
      }
      if (thirdsGroupIds.includes(m.group_id)) {
        if (!thirdsGroupFirstJoinedCalendarYmd || calYmd < thirdsGroupFirstJoinedCalendarYmd) {
          thirdsGroupFirstJoinedCalendarYmd = calYmd;
        }
      }
    }
  }

  for (const mtg of allCompletedMeetings) {
    touchEarliest(mtg.meeting_date, earliest);
  }

  const attendedMeetingIdSet = new Set(
    (attendedAllMeetingsRes.data ?? []).map((r) => r.meeting_id)
  );
  const attendedThirdsWeekStarts = new Set<string>();
  for (const mtg of allCompletedMeetings) {
    if (!attendedMeetingIdSet.has(mtg.id)) continue;
    attendedThirdsWeekStarts.add(pillarWeekStartKeyFromDateYmd(mtg.meeting_date, tz));
  }
  for (const row of soloFinalizedRes.data ?? []) {
    const m = row.week_start_monday.slice(0, 10);
    const soloEnd = ymdAddCalendarDays(m, 6);
    attendedThirdsWeekStarts.add(pillarWeekStartKeyFromDateYmd(m, tz));
    const kEnd = pillarWeekStartKeyFromDateYmd(soloEnd, tz);
    if (kEnd !== pillarWeekStartKeyFromDateYmd(m, tz)) {
      attendedThirdsWeekStarts.add(kEnd);
    }
  }

  function inThirdsGroupForWeek(weekStartSundayYmd: string): boolean {
    const weekEnd = ymdAddCalendarDays(weekStartSundayYmd, 6);
    if (participationStartedYmd && participationStartedYmd <= weekEnd) return true;
    if (thirdsGroupFirstJoinedCalendarYmd && thirdsGroupFirstJoinedCalendarYmd <= weekEnd)
      return true;
    return false;
  }

  const currentPillarStartYmd = pillar.startYmd;
  let firstSunday = currentPillarStartYmd;
  if (earliest.min) {
    firstSunday = pillarWeekStartKeyFromDateYmd(earliest.min, tz);
    if (firstSunday > currentPillarStartYmd) firstSunday = currentPillarStartYmd;
  }

  const pillarWeekStartYmids = enumeratePillarWeekStartYmids(
    firstSunday,
    currentPillarStartYmd
  );

  const cumulative = computeCumulativeBadwr({
    pillarWeekStartYmids,
    currentPillarWeekStartYmd: currentPillarStartYmd,
    now,
    practiceTimeZone: tz,
    weeklyShareGoalEncounters: shareWeeklyGoalEncounters,
    weeklyPrayerGoalMinutes: prayerWeeklyGoalMinutes,
    buckets,
    chatEngagedWeekStartYmd,
    currentChatPillar: weeklyPillars[2],
    attendedThirdsWeekStarts,
    inThirdsGroupForWeek,
    participationMetrics: thirdsParticipationMetrics,
    attendedCompletedThisWeekForCurrent: attendedThirdsThisWeek,
    inThirdsGroupNow: inThirdsGroup,
    countAdjustments,
    currentWeekPaceDayIndex: anchor.dayIndex,
    currentWeekOnboardingPace: onboardingPace,
  });

  const pillars = mergeCumulativeIntoWeeklyTemplates(weeklyPillars, cumulative);
  const overallPercent = overallReproductionPercent(pillars);

  const tierOrder: Record<BadwrPillarModel["tier"], number> = {
    attention: 0,
    ok: 1,
    strong: 2,
  };
  const focusAreas = [...weeklyPillars]
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
