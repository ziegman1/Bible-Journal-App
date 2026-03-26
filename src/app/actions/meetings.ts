"use server";

import { createClient } from "@/lib/supabase/server";
import type { StarterTrackLookBackPayload } from "@/lib/groups/starter-track/starter-track-lookback";
import {
  presenterStateToUpsert,
  rowToPresenterState,
  type MeetingPresenterStateRow,
  type PresenterState,
} from "@/lib/groups/meeting-presenter-state";
import {
  embedTrainInSharing,
  isTrainColumnSchemaError,
  normalizeLookforwardRow,
  splitSharingAndTrain,
} from "@/lib/groups/lookforward-train-embed";
import {
  mapGroupMembersByUserId,
  normalizeMeetingUserId,
  resolveMemberDisplayName,
} from "@/lib/groups/member-display-name";
import {
  linesFromLookforwardRows,
  sortAccountabilityLines,
  type AccountabilityCheckupLine,
} from "@/lib/groups/accountability-checkup";
import { formatObservationVerseRef } from "@/lib/groups/observation-verse-ref";
import { revalidatePath } from "next/cache";

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** Any member of the group (not platform-wide; invite/member admin lives in groups.ts). */
async function requireGroupMember(
  supabase: SupabaseServer,
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return { error: "Not a member of this group" };
  return { ok: true };
}

type LookforwardRowForAccountability = {
  user_id: string;
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment?: string | null;
};

async function fetchLookforwardRowsForMeeting(
  supabase: SupabaseServer,
  priorMeetingId: string
): Promise<
  | { ok: true; rows: LookforwardRowForAccountability[] }
  | { ok: false; message: string }
> {
  const lfsWithTrain = await supabase
    .from("lookforward_responses")
    .select("user_id, obedience_statement, sharing_commitment, train_commitment")
    .eq("meeting_id", priorMeetingId);

  if (
    lfsWithTrain.error &&
    isTrainColumnSchemaError(lfsWithTrain.error.message)
  ) {
    const lfsNoTrain = await supabase
      .from("lookforward_responses")
      .select("user_id, obedience_statement, sharing_commitment")
      .eq("meeting_id", priorMeetingId);
    if (lfsNoTrain.error) return { ok: false, message: lfsNoTrain.error.message };
    return {
      ok: true,
      rows: (lfsNoTrain.data ?? []).map((row) => ({
        ...row,
        train_commitment: null,
      })),
    };
  }
  if (lfsWithTrain.error) {
    return { ok: false, message: lfsWithTrain.error.message };
  }
  return { ok: true, rows: lfsWithTrain.data ?? [] };
}

async function revalidateMeetingPaths(
  supabase: SupabaseServer,
  meetingId: string
) {
  const { data: row } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();
  if (!row?.group_id) return;
  const gid = row.group_id;
  revalidatePath(`/app/groups/${gid}/meetings/${meetingId}`);
  revalidatePath(`/app/groups/${gid}/meetings/${meetingId}/present`);
  revalidatePath(`/app/groups/${gid}/meetings/${meetingId}/summary`);
  revalidatePath(`/app/groups/${gid}/meetings`);
  revalidatePath(`/app/groups/${gid}`);
  revalidatePath(`/app/groups/${gid}/starter-track`);
}

export async function listGroupMeetings(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meetings, error } = await supabase
    .from("group_meetings")
    .select(
      `
      id,
      title,
      meeting_date,
      status,
      facilitator_user_id,
      story_source_type,
      book,
      chapter,
      verse_start,
      verse_end,
      preset_story_id,
      starter_track_week,
      preset_stories (title, book, chapter, verse_start, verse_end)
    `
    )
    .eq("group_id", groupId)
    .order("meeting_date", { ascending: false });

  if (error) return { error: error.message };

  return { meetings: meetings ?? [] };
}

export async function getPresetStories() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data, error } = await supabase
    .from("preset_stories")
    .select("*")
    .order("series_name")
    .order("series_order");

  if (error) return { error: error.message };

  const bySeries = (data ?? []).reduce<
    Record<string, { id: string; title: string; book: string; chapter: number; verse_start: number; verse_end: number }[]>
  >((acc, s) => {
    const key = s.series_name ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: s.id,
      title: s.title,
      book: s.book,
      chapter: s.chapter,
      verse_start: s.verse_start,
      verse_end: s.verse_end,
    });
    return acc;
  }, {});

  return { stories: data ?? [], bySeries };
}

export async function createGroupMeeting(
  groupId: string,
  data: {
    meetingDate: string;
    title?: string;
    storySourceType: "manual_passage" | "preset_story";
    book?: string;
    chapter?: number;
    verseStart?: number;
    verseEnd?: number;
    presetStoryId?: string;
    facilitatorUserId?: string;
    /** When set, completing this meeting can advance Starter Track progress. */
    starterTrackWeek?: number;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting, error } = await supabase
    .from("group_meetings")
    .insert({
      group_id: groupId,
      title: data.title?.trim() || null,
      meeting_date: data.meetingDate,
      story_source_type: data.storySourceType,
      book: data.book ?? null,
      chapter: data.chapter ?? null,
      verse_start: data.verseStart ?? null,
      verse_end: data.verseEnd ?? null,
      preset_story_id: data.presetStoryId ?? null,
      facilitator_user_id: data.facilitatorUserId ?? null,
      starter_track_week: data.starterTrackWeek ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (members?.length) {
    await supabase.from("meeting_participants").insert(
      members.map((m) => ({
        meeting_id: meeting.id,
        user_id: m.user_id,
        present: true,
      }))
    );
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/meetings`);
  if (data.starterTrackWeek != null) {
    revalidatePath(`/app/groups/${groupId}/starter-track`);
  }
  return { success: true, meetingId: meeting.id };
}

export async function getMeetingDetail(meetingId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting, error } = await supabase
    .from("group_meetings")
    .select(
      `
      *,
      preset_stories (title, book, chapter, verse_start, verse_end, description),
      groups!group_id (id, name)
    `
    )
    .eq("id", meetingId)
    .single();

  if (error || !meeting) return { error: error?.message ?? "Meeting not found" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", meeting.group_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "Not a member of this group" };

  const { data: groupMemberNameRows } = await supabase
    .from("group_members")
    .select("user_id, first_name, last_name, email")
    .eq("group_id", meeting.group_id);

  const gmByUserId = mapGroupMembersByUserId(groupMemberNameRows ?? []);

  const { data: participants } = await supabase
    .from("meeting_participants")
    .select("user_id, present, joined_at")
    .eq("meeting_id", meetingId);

  const allGroupUserIds = [
    ...new Set(
      (groupMemberNameRows ?? [])
        .map((m) => normalizeMeetingUserId(m.user_id))
        .filter((k): k is string => Boolean(k))
    ),
  ];

  const groupWideProfileById: Record<string, string | undefined> = {};
  if (allGroupUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", allGroupUserIds);
    (profiles ?? []).forEach((p) => {
      const v = p.display_name?.trim();
      const pk = normalizeMeetingUserId(p.id);
      if (v && pk) groupWideProfileById[pk] = v;
    });
  }

  const memberDisplayNames: Record<string, string> = {};
  for (const uid of allGroupUserIds) {
    memberDisplayNames[uid] = resolveMemberDisplayName(
      uid,
      groupWideProfileById[uid],
      gmByUserId[uid]
    );
  }

  const participantsWithNames = (participants ?? []).map((p) => {
    const k = normalizeMeetingUserId(p.user_id);
    if (!k) {
      return { ...p, display_name: "Member" as string };
    }
    return {
      ...p,
      user_id: k,
      display_name:
        memberDisplayNames[k] ??
        resolveMemberDisplayName(
          k,
          groupWideProfileById[k],
          gmByUserId[k]
        ),
    };
  });

  const nameByUserId: Record<string, string> = {};
  participantsWithNames.forEach((p) => {
    nameByUserId[p.user_id] = p.display_name;
  });

  let priorCommitments: {
    obedience: string;
    sharing: string;
    train?: string;
  } | null = null;

  let starterTrackLookBack: StarterTrackLookBackPayload | null = null;

  let accountabilityCheckupLines: AccountabilityCheckupLine[] = [];

  const starterWeek =
    (meeting as { starter_track_week?: number | null }).starter_track_week ?? null;

  if (starterWeek != null) {
    const { data: en } = await supabase
      .from("group_starter_track_enrollment")
      .select("vision_statement")
      .eq("group_id", meeting.group_id)
      .maybeSingle();

    const groupVisionStatement = en?.vision_statement?.trim() || null;

    if (starterWeek === 1) {
      priorCommitments = null;
      starterTrackLookBack = {
        groupVisionStatement,
        checkUpMode: "week1_teaching",
        priorWeekByMember: [],
      };
    } else {
      const { data: priorRow } = await supabase
        .from("group_meetings")
        .select("id")
        .eq("group_id", meeting.group_id)
        .eq("status", "completed")
        .eq("starter_track_week", starterWeek - 1)
        .order("meeting_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!priorRow?.id) {
        priorCommitments = null;
        starterTrackLookBack = {
          groupVisionStatement,
          checkUpMode: "week1_teaching",
          priorWeekByMember: [],
        };
      } else {
        const lfFetched = await fetchLookforwardRowsForMeeting(
          supabase,
          priorRow.id
        );
        if (!lfFetched.ok) return { error: lfFetched.message };
        const lfList = lfFetched.rows;
        const lfUserIds = [
          ...new Set(
            lfList
              .map((r) => normalizeMeetingUserId(r.user_id))
              .filter((k): k is string => Boolean(k))
          ),
        ];
        const nameMap: Record<string, string> = { ...nameByUserId };
        for (const uid of lfUserIds) {
          nameMap[uid] = resolveMemberDisplayName(
            uid,
            groupWideProfileById[uid],
            gmByUserId[uid]
          );
        }

        const priorWeekByMember = lfList.map((row) => {
          const { sharing, train } = splitSharingAndTrain(row);
          const rk = normalizeMeetingUserId(row.user_id) ?? row.user_id;
          return {
            userId: rk,
            displayName: nameMap[rk] ?? "Member",
            obedience: row.obedience_statement,
            sharing,
            train,
          };
        });

        const resolveName = (uid: string) =>
          nameMap[normalizeMeetingUserId(uid) ?? uid] ?? "Member";

        accountabilityCheckupLines = linesFromLookforwardRows(
          priorRow.id,
          lfList,
          resolveName,
          false
        );

        if (starterWeek != null && starterWeek >= 3) {
          const { data: prior2Row } = await supabase
            .from("group_meetings")
            .select("id")
            .eq("group_id", meeting.group_id)
            .eq("status", "completed")
            .eq("starter_track_week", starterWeek - 2)
            .order("meeting_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (prior2Row?.id) {
            const lf2Fetched = await fetchLookforwardRowsForMeeting(
              supabase,
              prior2Row.id
            );
            if (!lf2Fetched.ok) return { error: lf2Fetched.message };
            const lf2 = lf2Fetched.rows;

            const { data: completedInP } = await supabase
              .from("meeting_commitment_checkoffs")
              .select("subject_user_id, pillar")
              .eq("meeting_id", priorRow.id)
              .eq("source_meeting_id", prior2Row.id)
              .eq("is_complete", true);

            const done = new Set(
              (completedInP ?? []).map(
                (r) =>
                  `${normalizeMeetingUserId(r.subject_user_id) ?? r.subject_user_id}:${r.pillar}`
              )
            );

            const carry = linesFromLookforwardRows(
              prior2Row.id,
              lf2,
              resolveName,
              true
            ).filter(
              (ln) =>
                !done.has(
                  `${normalizeMeetingUserId(ln.subjectUserId) ?? ln.subjectUserId}:${ln.pillar}`
                )
            );

            accountabilityCheckupLines = [...carry, ...accountabilityCheckupLines];
          }
        }

        accountabilityCheckupLines =
          sortAccountabilityLines(accountabilityCheckupLines);

        const myId = normalizeMeetingUserId(user.id);
        const mine = myId
          ? lfList.find((r) => normalizeMeetingUserId(r.user_id) === myId)
          : undefined;
        if (mine) {
          const { sharing, train } = splitSharingAndTrain(mine);
          priorCommitments = {
            obedience: mine.obedience_statement,
            sharing,
            train,
          };
        } else {
          priorCommitments = null;
        }

        if (priorWeekByMember.length === 0) {
          priorCommitments = null;
          accountabilityCheckupLines = [];
          starterTrackLookBack = {
            groupVisionStatement,
            checkUpMode: "week1_teaching",
            priorWeekByMember: [],
          };
        } else {
          starterTrackLookBack = {
            groupVisionStatement,
            checkUpMode: "prior_group_commitments",
            priorWeekByMember,
          };
        }
      }
    }
  } else {
    const priorMeeting = await supabase
      .from("group_meetings")
      .select("id, meeting_date")
      .eq("group_id", meeting.group_id)
      .lt("meeting_date", meeting.meeting_date)
      .eq("status", "completed")
      .order("meeting_date", { ascending: false })
      .limit(1)
      .single();

    if (priorMeeting?.data?.id) {
      const priorWithTrain = await supabase
        .from("lookforward_responses")
        .select("obedience_statement, sharing_commitment, train_commitment")
        .eq("meeting_id", priorMeeting.data.id)
        .eq("user_id", user.id)
        .single();

      let prior: {
        obedience_statement: string;
        sharing_commitment: string;
        train_commitment?: string | null;
      } | null = null;

      if (
        priorWithTrain.error &&
        isTrainColumnSchemaError(priorWithTrain.error.message)
      ) {
        const priorNoTrain = await supabase
          .from("lookforward_responses")
          .select("obedience_statement, sharing_commitment")
          .eq("meeting_id", priorMeeting.data.id)
          .eq("user_id", user.id)
          .single();
        if (!priorNoTrain.error && priorNoTrain.data) {
          prior = { ...priorNoTrain.data, train_commitment: null };
        }
      } else if (!priorWithTrain.error && priorWithTrain.data) {
        prior = priorWithTrain.data;
      }

      if (prior) {
        const { sharing, train } = splitSharingAndTrain(prior);
        priorCommitments = {
          obedience: prior.obedience_statement,
          sharing,
          train,
        };
      }

      const pid = priorMeeting.data.id;
      const lfAllFetched = await fetchLookforwardRowsForMeeting(supabase, pid);
      if (!lfAllFetched.ok) return { error: lfAllFetched.message };
      const lfAll = lfAllFetched.rows;

      const resolveNameG = (uid: string) => {
        const k = normalizeMeetingUserId(uid) ?? uid;
        return (
          memberDisplayNames[k] ??
          resolveMemberDisplayName(k, groupWideProfileById[k], gmByUserId[k])
        );
      };

      accountabilityCheckupLines = linesFromLookforwardRows(
        pid,
        lfAll,
        resolveNameG,
        false
      );

      const pDate = priorMeeting.data.meeting_date as string | undefined;
      if (pDate) {
        const { data: prior2Meeting } = await supabase
          .from("group_meetings")
          .select("id")
          .eq("group_id", meeting.group_id)
          .eq("status", "completed")
          .lt("meeting_date", pDate)
          .order("meeting_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (prior2Meeting?.id) {
          const lf2Fetched = await fetchLookforwardRowsForMeeting(
            supabase,
            prior2Meeting.id
          );
          if (!lf2Fetched.ok) return { error: lf2Fetched.message };

          const { data: completedInP } = await supabase
            .from("meeting_commitment_checkoffs")
            .select("subject_user_id, pillar")
            .eq("meeting_id", pid)
            .eq("source_meeting_id", prior2Meeting.id)
            .eq("is_complete", true);

          const done = new Set(
            (completedInP ?? []).map(
              (r) =>
                `${normalizeMeetingUserId(r.subject_user_id) ?? r.subject_user_id}:${r.pillar}`
            )
          );

          const carry = linesFromLookforwardRows(
            prior2Meeting.id,
            lf2Fetched.rows,
            resolveNameG,
            true
          ).filter(
            (ln) =>
              !done.has(
                `${normalizeMeetingUserId(ln.subjectUserId) ?? ln.subjectUserId}:${ln.pillar}`
              )
          );

          accountabilityCheckupLines = [...carry, ...accountabilityCheckupLines];
        }
      }

      accountabilityCheckupLines =
        sortAccountabilityLines(accountabilityCheckupLines);
    }
  }

  const lookback = await supabase
    .from("lookback_responses")
    .select("*")
    .eq("meeting_id", meetingId);

  const lookforwardRes = await supabase
    .from("lookforward_responses")
    .select("*")
    .eq("meeting_id", meetingId);

  const lookforward =
    lookforwardRes.data?.map((r) =>
      normalizeLookforwardRow(r as Record<string, unknown>)
    ) ?? [];

  const observations = await supabase
    .from("passage_observations")
    .select("*")
    .eq("meeting_id", meetingId);

  const retell = await supabase
    .from("story_retell_assignments")
    .select("*")
    .eq("meeting_id", meetingId)
    .single();

  const practice = await supabase
    .from("group_practice_assignments")
    .select("*")
    .eq("meeting_id", meetingId);

  const priorFollowups = await supabase
    .from("prior_obedience_followups")
    .select("*")
    .eq("meeting_id", meetingId);

  const { data: commitmentCheckoffRows } = await supabase
    .from("meeting_commitment_checkoffs")
    .select(
      "id, meeting_id, source_meeting_id, subject_user_id, pillar, is_complete, updated_by, updated_at"
    )
    .eq("meeting_id", meetingId)
    .eq("is_complete", true);

  const { data: presenterStateRow } = await supabase
    .from("meeting_presenter_state")
    .select("*")
    .eq("meeting_id", meetingId)
    .maybeSingle();

  /** 1-based: first Starter Track meeting in this group (by date, then id) is 1. */
  let starterTrackMeetingOrdinal: number | null = null;
  if (starterWeek != null && starterWeek >= 1 && starterWeek <= 8) {
    const { data: stRows, error: stErr } = await supabase
      .from("group_meetings")
      .select("id, meeting_date")
      .eq("group_id", meeting.group_id)
      .not("starter_track_week", "is", null)
      .gte("starter_track_week", 1)
      .lte("starter_track_week", 8);

    if (!stErr && stRows && stRows.length > 0) {
      const sorted = [...stRows].sort((a, b) => {
        const da = String(a.meeting_date).localeCompare(String(b.meeting_date));
        if (da !== 0) return da;
        return String(a.id).localeCompare(String(b.id));
      });
      const idx = sorted.findIndex((m) => m.id === meetingId);
      starterTrackMeetingOrdinal = idx >= 0 ? idx + 1 : 1;
    } else {
      starterTrackMeetingOrdinal = 1;
    }
  }

  return {
    meeting,
    role: membership.role,
    participants: participantsWithNames,
    memberDisplayNames,
    priorCommitments,
    starterTrackLookBack,
    lookback: lookback.data ?? [],
    lookforward,
    observations: observations.data ?? [],
    retell: retell.data,
    practice: practice.data ?? [],
    priorFollowups: priorFollowups.data ?? [],
    accountabilityCheckupLines,
    commitmentCheckoffs: commitmentCheckoffRows ?? [],
    presenterState: (presenterStateRow as MeetingPresenterStateRow | null) ?? null,
    starterTrackMeetingOrdinal,
  };
}

export async function updateMeetingPresenterState(
  meetingId: string,
  next: PresenterState
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const { data: gm } = await supabase
    .from("group_meetings")
    .select("facilitator_user_id")
    .eq("id", meetingId)
    .single();

  const fac = gm?.facilitator_user_id
    ? normalizeMeetingUserId(gm.facilitator_user_id) ?? gm.facilitator_user_id
    : null;
  const me = normalizeMeetingUserId(user.id) ?? user.id;
  if (fac && fac !== me) {
    return {
      error:
        "Only the designated live facilitator can change presenter slides. Use the Facilitator / TV view while signed in as that person.",
    };
  }

  const safe = rowToPresenterState({
    meeting_id: meetingId,
    active_third: next.activeThird,
    look_back_slide: next.lookBackSlide,
    look_up_phase: next.lookUpPhase,
    read_chunk_index: next.readChunkIndex,
    reread_chunk_index: next.rereadChunkIndex,
    forward_sub: next.forwardSub,
    practice_slide_index: next.practiceSlideIndex,
    updated_at: "",
    updated_by: null,
  });

  const payload = {
    ...presenterStateToUpsert(meetingId, safe, user.id),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("meeting_presenter_state").upsert(payload, {
    onConflict: "meeting_id",
  });

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}/present`);
  revalidatePath(`/app/groups/${meeting.group_id}/meetings`);
  revalidatePath(`/app/groups/${meeting.group_id}`);

  return { success: true };
}

export async function updateMeetingStatus(
  meetingId: string,
  status: "draft" | "active" | "completed"
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id, starter_track_week")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const { error } = await supabase
    .from("group_meetings")
    .update({ status })
    .eq("id", meetingId);

  if (error) return { error: error.message };

  if (
    status === "completed" &&
    meeting.starter_track_week != null &&
    meeting.starter_track_week >= 1 &&
    meeting.starter_track_week <= 8
  ) {
    const { data: en } = await supabase
      .from("group_starter_track_enrollment")
      .select("weeks_completed, vision_completed_at")
      .eq("group_id", meeting.group_id)
      .maybeSingle();

    if (
      en?.vision_completed_at &&
      meeting.starter_track_week === en.weeks_completed + 1
    ) {
      await supabase
        .from("group_starter_track_enrollment")
        .update({ weeks_completed: meeting.starter_track_week })
        .eq("group_id", meeting.group_id);
      revalidatePath(`/app/groups/${meeting.group_id}/starter-track`);
      for (let w = 1; w <= 8; w++) {
        revalidatePath(`/app/groups/${meeting.group_id}/starter-track/week/${w}`);
      }
    }
  }

  revalidatePath(`/app/groups/${meeting.group_id}/meetings`);
  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  revalidatePath(
    `/app/groups/${meeting.group_id}/meetings/${meetingId}/summary`
  );
  revalidatePath(`/app/groups/${meeting.group_id}`);
  return { success: true };
}

/**
 * When Facilitator / TV view opens: once per meeting, pick live facilitator from
 * who is online (presence) and store on `group_meetings`. Deterministic: sorted UUID, first wins.
 */
export async function commencePresentFacilitatorFromPresence(
  meetingId: string,
  onlineUserIds: string[]
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting, error: meetErr } = await supabase
    .from("group_meetings")
    .select("group_id, status, facilitator_user_id, present_facilitator_commenced_at")
    .eq("id", meetingId)
    .single();

  if (meetErr || !meeting) return { error: meetErr?.message ?? "Meeting not found" };

  const memberGate = await requireGroupMember(
    supabase,
    meeting.group_id,
    user.id
  );
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  if (meeting.status === "completed") {
    return {
      success: true as const,
      skipped: true as const,
      facilitatorUserId: meeting.facilitator_user_id ?? null,
      commenced: false as const,
    };
  }

  const uid = normalizeMeetingUserId(user.id) ?? user.id;
  const rawIds = [...new Set(onlineUserIds.map((id) => normalizeMeetingUserId(id) ?? id))];
  if (!rawIds.includes(uid)) rawIds.push(uid);

  const { data: members, error: memErr } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", meeting.group_id);

  if (memErr) return { error: memErr.message };
  const memberSet = new Set(
    (members ?? [])
      .map((m) => normalizeMeetingUserId(m.user_id) ?? m.user_id)
      .filter(Boolean)
  );

  const valid = rawIds.filter((id) => memberSet.has(id)).sort((a, b) => a.localeCompare(b));
  if (valid.length === 0) {
    return { error: "No group members in the online list to assign as facilitator." };
  }

  const chosen = valid[0]!;

  const commencedAt = new Date().toISOString();
  const { data: updated, error: upErr } = await supabase
    .from("group_meetings")
    .update({
      facilitator_user_id: chosen,
      present_facilitator_commenced_at: commencedAt,
    })
    .eq("id", meetingId)
    .is("present_facilitator_commenced_at", null)
    .neq("status", "completed")
    .select("facilitator_user_id")
    .maybeSingle();

  if (upErr) return { error: upErr.message };

  if (updated?.facilitator_user_id) {
    revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
    revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}/present`);
    revalidatePath(`/app/groups/${meeting.group_id}/meetings`);
    revalidatePath(`/app/groups/${meeting.group_id}`);
    return {
      success: true as const,
      skipped: false as const,
      facilitatorUserId: updated.facilitator_user_id as string,
      commenced: true as const,
    };
  }

  const { data: current } = await supabase
    .from("group_meetings")
    .select("facilitator_user_id")
    .eq("id", meetingId)
    .single();

  return {
    success: true as const,
    skipped: true as const,
    facilitatorUserId: (current?.facilitator_user_id as string | null) ?? null,
    commenced: false as const,
  };
}

export async function assignFacilitator(
  meetingId: string,
  userId: string | null
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const { error } = await supabase
    .from("group_meetings")
    .update({ facilitator_user_id: userId })
    .eq("id", meetingId);

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  return { success: true };
}

export async function assignStoryReteller(
  meetingId: string,
  userId: string,
  mode: "manual" | "random"
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const { error } = await supabase.from("story_retell_assignments").upsert(
    {
      meeting_id: meetingId,
      assigned_user_id: userId,
      assigned_by_mode: mode,
    },
    { onConflict: "meeting_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  return { success: true };
}

export async function saveLookBackResponse(
  meetingId: string,
  data: {
    pastoralCareResponse?: string;
    accountabilityResponse?: string;
    visionCastingResponse?: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("lookback_responses").upsert(
    {
      meeting_id: meetingId,
      user_id: user.id,
      pastoral_care_response: data.pastoralCareResponse ?? null,
      accountability_response: data.accountabilityResponse ?? null,
      vision_casting_response: data.visionCastingResponse ?? null,
    },
    { onConflict: "meeting_id,user_id" }
  );

  if (error) return { error: error.message };

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

export async function savePriorObedienceFollowup(
  meetingId: string,
  data: {
    priorCommitmentSummary: string;
    obedienceFollowupResponse?: string;
    sharingFollowupResponse?: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("prior_obedience_followups").upsert(
    {
      meeting_id: meetingId,
      user_id: user.id,
      prior_commitment_summary: data.priorCommitmentSummary,
      obedience_followup_response: data.obedienceFollowupResponse ?? null,
      sharing_followup_response: data.sharingFollowupResponse ?? null,
    },
    { onConflict: "meeting_id,user_id" }
  );

  if (error) return { error: error.message };

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

export async function saveMeetingCommitmentCheckoff(
  meetingId: string,
  data: {
    sourceMeetingId: string;
    subjectUserId: string;
    pillar: "obedience" | "sharing" | "train";
    isComplete: boolean;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const subjectKey =
    normalizeMeetingUserId(data.subjectUserId) ?? data.subjectUserId;

  if (data.isComplete) {
    const { error } = await supabase.from("meeting_commitment_checkoffs").upsert(
      {
        meeting_id: meetingId,
        source_meeting_id: data.sourceMeetingId,
        subject_user_id: subjectKey,
        pillar: data.pillar,
        is_complete: true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "meeting_id,source_meeting_id,subject_user_id,pillar",
      }
    );
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("meeting_commitment_checkoffs")
      .delete()
      .eq("meeting_id", meetingId)
      .eq("source_meeting_id", data.sourceMeetingId)
      .eq("subject_user_id", subjectKey)
      .eq("pillar", data.pillar);
    if (error) return { error: error.message };
  }

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

type MeetingPassageBounds = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  groupId: string;
};

async function getMeetingPassageVerseBounds(
  supabase: SupabaseServer,
  meetingId: string
): Promise<MeetingPassageBounds | null> {
  const { data: m, error } = await supabase
    .from("group_meetings")
    .select(
      "group_id, story_source_type, book, chapter, verse_start, verse_end, preset_stories(book, chapter, verse_start, verse_end)"
    )
    .eq("id", meetingId)
    .single();

  if (error || !m) return null;

  if (m.story_source_type === "preset_story" && m.preset_stories) {
    const raw = m.preset_stories as unknown;
    const p = (Array.isArray(raw) ? raw[0] : raw) as {
      book: string;
      chapter: number;
      verse_start: number;
      verse_end: number;
    } | null;
    if (
      p &&
      typeof p.book === "string" &&
      typeof p.chapter === "number" &&
      typeof p.verse_start === "number" &&
      typeof p.verse_end === "number"
    ) {
      return {
        book: p.book,
        chapter: p.chapter,
        verseStart: p.verse_start,
        verseEnd: p.verse_end,
        groupId: m.group_id,
      };
    }
  }

  if (
    m.book &&
    m.chapter != null &&
    m.verse_start != null &&
    m.verse_end != null
  ) {
    return {
      book: m.book,
      chapter: m.chapter,
      verseStart: m.verse_start,
      verseEnd: m.verse_end,
      groupId: m.group_id,
    };
  }

  return null;
}

export async function savePassageObservation(
  meetingId: string,
  data: {
    observationType: "like" | "difficult" | "teaches_about_people" | "teaches_about_god";
    book: string;
    chapter: number;
    /**
     * Start verse. Omit or null = no verse anchor (allowed except Starter Track weeks 1–8).
     */
    verseNumber?: number | null;
    /** Inclusive end verse; only when verseNumber is set; omit or same for a single verse. */
    verseEnd?: number | null;
    note?: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meetingRow } = await supabase
    .from("group_meetings")
    .select("group_id, starter_track_week")
    .eq("id", meetingId)
    .single();

  if (!meetingRow?.group_id) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(
    supabase,
    meetingRow.group_id,
    user.id
  );
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const st = meetingRow.starter_track_week;
  const isStarterTrack = st != null && st >= 1 && st <= 8;

  const rawStart = data.verseNumber;
  const vStart =
    rawStart != null && Number.isFinite(Number(rawStart))
      ? Number(rawStart)
      : null;

  if (isStarterTrack && vStart == null) {
    return {
      error:
        "Starter Track meetings require a verse focus (start and end verse) for each observation.",
    };
  }

  let vEnd: number | null = null;
  if (vStart != null && data.verseEnd != null && Number.isFinite(Number(data.verseEnd))) {
    const e = Number(data.verseEnd);
    vEnd = e !== vStart ? e : null;
  }

  if (vStart != null && vEnd != null && vEnd < vStart) {
    return { error: "End verse must be the same as or after the start verse." };
  }

  const bounds = await getMeetingPassageVerseBounds(supabase, meetingId);

  if (bounds) {
    const bookOk =
      bounds.book.trim().toLowerCase() === data.book.trim().toLowerCase();
    const chOk = bounds.chapter === data.chapter;
    if (!bookOk || !chOk) {
      return {
        error: "Use this meeting’s passage (book and chapter) for observations.",
      };
    }
    if (vStart != null) {
      if (
        vStart < bounds.verseStart ||
        vStart > bounds.verseEnd ||
        (vEnd != null &&
          (vEnd < bounds.verseStart || vEnd > bounds.verseEnd))
      ) {
        return {
          error: `Choose verse(s) between ${bounds.verseStart} and ${bounds.verseEnd}.`,
        };
      }
    }
  }

  const { error } = await supabase.from("passage_observations").upsert(
    {
      meeting_id: meetingId,
      user_id: user.id,
      observation_type: data.observationType,
      book: data.book,
      chapter: data.chapter,
      verse_number: vStart,
      verse_end: vStart == null ? null : vEnd,
      note: data.note?.trim() ? data.note.trim() : null,
    },
    { onConflict: "meeting_id,user_id,observation_type" }
  );

  if (error) return { error: error.message };

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

/** Current user’s passage observations for one meeting (Look Up notes). RLS applies. */
export async function getMyPassageObservationsForMeeting(meetingId: string): Promise<{
  observations: {
    id: string;
    meeting_id: string;
    user_id: string;
    observation_type: string;
    book: string;
    chapter: number;
    verse_number: number | null;
    verse_end: number | null;
    note: string | null;
  }[];
  error?: string;
}> {
  const supabase = await createClient();
  if (!supabase) return { observations: [], error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { observations: [], error: "Not authenticated" };

  const { data: meetingRow } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meetingRow?.group_id) return { observations: [], error: "Meeting not found" };

  const memberGate = await requireGroupMember(
    supabase,
    meetingRow.group_id,
    user.id
  );
  if ("error" in memberGate && memberGate.error) {
    return { observations: [], error: memberGate.error };
  }

  const { data, error } = await supabase
    .from("passage_observations")
    .select(
      "id, meeting_id, user_id, observation_type, book, chapter, verse_number, verse_end, note"
    )
    .eq("meeting_id", meetingId)
    .eq("user_id", user.id);

  if (error) return { observations: [], error: error.message };

  const observations = (data ?? []).map((row) => ({
    id: String(row.id),
    meeting_id: String(row.meeting_id),
    user_id: String(row.user_id),
    observation_type: String(row.observation_type),
    book: String(row.book ?? ""),
    chapter: Number(row.chapter ?? 0),
    verse_number:
      row.verse_number == null || row.verse_number === ""
        ? null
        : Number(row.verse_number),
    verse_end:
      row.verse_end == null || row.verse_end === ""
        ? null
        : Number(row.verse_end),
    note: row.note != null ? String(row.note) : null,
  }));

  return { observations };
}

export async function saveLookForwardResponse(
  meetingId: string,
  data: {
    obedienceStatement: string;
    sharingCommitment: string;
    trainCommitment: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fullPayload = {
    meeting_id: meetingId,
    user_id: user.id,
    obedience_statement: data.obedienceStatement,
    sharing_commitment: data.sharingCommitment,
    train_commitment: data.trainCommitment,
  };

  let { error } = await supabase
    .from("lookforward_responses")
    .upsert(fullPayload, { onConflict: "meeting_id,user_id" });

  if (error && isTrainColumnSchemaError(error.message)) {
    const { error: errLegacy } = await supabase
      .from("lookforward_responses")
      .upsert(
        {
          meeting_id: meetingId,
          user_id: user.id,
          obedience_statement: data.obedienceStatement,
          sharing_commitment: embedTrainInSharing(
            data.sharingCommitment,
            data.trainCommitment
          ),
        },
        { onConflict: "meeting_id,user_id" }
      );
    error = errLegacy;
  }

  if (error) return { error: error.message };

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

export async function assignPracticeActivity(
  meetingId: string,
  data: {
    practiceType: "share_story" | "share_testimony" | "share_gospel" | "role_play_obedience";
    assignedUserId?: string;
    assignedByMode: "manual" | "random";
    notes?: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("group_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const { error } = await supabase.from("group_practice_assignments").insert({
    meeting_id: meetingId,
    practice_type: data.practiceType,
    assigned_user_id: data.assignedUserId ?? null,
    assigned_by_mode: data.assignedByMode,
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  return { success: true };
}

export async function generateMeetingSummary(meetingId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting } = await supabase
    .from("group_meetings")
    .select("*, preset_stories(title, book, chapter, verse_start, verse_end)")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "Meeting not found" };

  const memberGate = await requireGroupMember(supabase, meeting.group_id, user.id);
  if ("error" in memberGate && memberGate.error) return { error: memberGate.error };

  const passage =
    meeting.story_source_type === "preset_story" && meeting.preset_stories
      ? (meeting.preset_stories as { title: string; book: string; chapter: number; verse_start: number; verse_end: number })
      : meeting.book
        ? {
            title: `${meeting.book} ${meeting.chapter}:${meeting.verse_start}-${meeting.verse_end}`,
            book: meeting.book,
            chapter: meeting.chapter,
            verse_start: meeting.verse_start,
            verse_end: meeting.verse_end,
          }
        : null;

  const [
    { data: lookback },
    { data: lookforward },
    { data: observations },
    { data: practice },
    { data: priorFollowups },
  ] = await Promise.all([
    supabase.from("lookback_responses").select("*").eq("meeting_id", meetingId),
    supabase.from("lookforward_responses").select("*").eq("meeting_id", meetingId),
    supabase.from("passage_observations").select("*").eq("meeting_id", meetingId),
    supabase.from("group_practice_assignments").select("*").eq("meeting_id", meetingId),
    supabase.from("prior_obedience_followups").select("*").eq("meeting_id", meetingId),
  ]);

  const userIds = new Set<string>();
  for (const r of lookback ?? []) {
    const k = normalizeMeetingUserId(r.user_id);
    if (k) userIds.add(k);
  }
  for (const r of lookforward ?? []) {
    const k = normalizeMeetingUserId(r.user_id);
    if (k) userIds.add(k);
  }
  for (const o of observations ?? []) {
    const k = normalizeMeetingUserId(o.user_id);
    if (k) userIds.add(k);
  }

  const userIdList = Array.from(userIds);

  const { data: summaryGmRows } = await supabase
    .from("group_members")
    .select("user_id, first_name, last_name, email")
    .eq("group_id", meeting.group_id);

  const summaryGmByUserId = mapGroupMembersByUserId(summaryGmRows ?? []);

  const { data: profiles } =
    userIdList.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIdList)
      : { data: [] as { id: string; display_name: string | null }[] };

  const summaryProfileById: Record<string, string | undefined> = {};
  (profiles ?? []).forEach((p) => {
    const v =
      typeof p.display_name === "string" ? p.display_name.trim() : "";
    const pk = normalizeMeetingUserId(p.id);
    if (v && pk) summaryProfileById[pk] = v;
  });

  function displayNameFor(userId: string | null | undefined): string {
    const id = normalizeMeetingUserId(userId);
    if (!id) return "Member";
    return resolveMemberDisplayName(
      id,
      summaryProfileById[id],
      summaryGmByUserId[id]
    );
  }

  const OBSERVATION_TYPE_LABELS: Record<string, string> = {
    like: "What stood out / liked",
    difficult: "Difficult to understand or believe",
    teaches_about_people: "What it teaches about people",
    teaches_about_god: "What it teaches about God",
  };

  /**
   * Look Back: participants with any Look Back content; pastoral care lives here
   * with accountability and vision (no separate Prayer block in the UI).
   */
  const lookbackSummary = (lookback ?? [])
    .map((r) => {
      const uid = normalizeMeetingUserId(r.user_id);
      if (!uid) return null;
      const pastoral = String(r.pastoral_care_response ?? "").trim();
      const acc = String(r.accountability_response ?? "").trim();
      const vis = String(r.vision_casting_response ?? "").trim();
      if (!pastoral && !acc && !vis) return null;
      return {
        user: displayNameFor(uid),
        ...(acc ? { accountability: r.accountability_response } : {}),
        ...(vis ? { visionCasting: r.vision_casting_response } : {}),
        ...(pastoral ? { pastoralCare: r.pastoral_care_response } : {}),
      };
    })
    .filter(Boolean) as {
    user: string;
    accountability?: string | null;
    visionCasting?: string | null;
    pastoralCare?: string | null;
  }[];

  const observationsForSummary = (observations ?? [])
    .filter((o) => o.note != null && String(o.note).trim())
    .map((o) => {
      const book = String(o.book ?? "").trim();
      const ch = o.chapter;
      const vs = o.verse_number;
      const ve = o.verse_end;
      const verseRef =
        book && ch != null && vs != null && Number.isFinite(Number(vs))
          ? formatObservationVerseRef({
              book,
              chapter: Number(ch),
              verseStart: Number(vs),
              verseEnd:
                ve != null &&
                Number.isFinite(Number(ve)) &&
                Number(ve) !== Number(vs)
                  ? Number(ve)
                  : null,
            })
          : null;
      return {
        user: displayNameFor(o.user_id),
        typeLabel:
          OBSERVATION_TYPE_LABELS[o.observation_type] ?? o.observation_type,
        ...(verseRef ? { verseRef } : {}),
        note: String(o.note).trim(),
      };
    });

  const summaryJson = {
    passage,
    lookback: lookbackSummary,
    lookUp: {
      observations: observationsForSummary,
    },
    lookforward: (lookforward ?? [])
      .map((r) => {
        const row = r as {
          user_id: string;
          obedience_statement: string;
          sharing_commitment: string;
          train_commitment?: string | null;
        };
        const uid = normalizeMeetingUserId(row.user_id);
        if (!uid) return null;
        const { sharing, train } = splitSharingAndTrain(row);
        return {
          user: displayNameFor(uid),
          obedience: row.obedience_statement,
          sharing,
          train,
        };
      })
      .filter(Boolean),
    priorFollowups: priorFollowups ?? [],
    practice: practice ?? [],
  };

  const { error } = await supabase.from("meeting_summaries").upsert(
    {
      meeting_id: meetingId,
      summary_json: summaryJson,
      prayer_summary: "",
    },
    { onConflict: "meeting_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}/summary`);
  return { success: true };
}
