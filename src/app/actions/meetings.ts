"use server";

import { createClient } from "@/lib/supabase/server";
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

  const { data: participants } = await supabase
    .from("meeting_participants")
    .select("user_id, present, joined_at")
    .eq("meeting_id", meetingId);

  const userIds = (participants ?? []).map((p) => p.user_id);
  const displayNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    (profiles ?? []).forEach((p) => {
      displayNames[p.id] = p.display_name ?? "Member";
    });
  }

  const participantsWithNames = (participants ?? []).map((p) => ({
    ...p,
    display_name: displayNames[p.user_id] ?? "Member",
  }));

  const priorMeeting = await supabase
    .from("group_meetings")
    .select("id")
    .eq("group_id", meeting.group_id)
    .lt("meeting_date", meeting.meeting_date)
    .eq("status", "completed")
    .order("meeting_date", { ascending: false })
    .limit(1)
    .single();

  let priorCommitments: { obedience: string; sharing: string } | null = null;
  if (priorMeeting?.data?.id) {
    const { data: prior } = await supabase
      .from("lookforward_responses")
      .select("obedience_statement, sharing_commitment")
      .eq("meeting_id", priorMeeting.data.id)
      .eq("user_id", user.id)
      .single();
    if (prior) {
      priorCommitments = {
        obedience: prior.obedience_statement,
        sharing: prior.sharing_commitment,
      };
    }
  }

  const lookback = await supabase
    .from("lookback_responses")
    .select("*")
    .eq("meeting_id", meetingId);

  const lookforward = await supabase
    .from("lookforward_responses")
    .select("*")
    .eq("meeting_id", meetingId);

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

  return {
    meeting,
    role: membership.role,
    participants: participantsWithNames,
    priorCommitments,
    lookback: lookback.data ?? [],
    lookforward: lookforward.data ?? [],
    observations: observations.data ?? [],
    retell: retell.data,
    practice: practice.data ?? [],
    priorFollowups: priorFollowups.data ?? [],
  };
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
  revalidatePath(`/app/groups/${meeting.group_id}`);
  return { success: true };
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

export async function savePassageObservation(
  meetingId: string,
  data: {
    observationType: "like" | "difficult" | "teaches_about_people" | "teaches_about_god";
    book: string;
    chapter: number;
    verseNumber: number;
    note?: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("passage_observations").insert({
    meeting_id: meetingId,
    user_id: user.id,
    observation_type: data.observationType,
    book: data.book,
    chapter: data.chapter,
    verse_number: data.verseNumber,
    note: data.note ?? null,
  });

  if (error) return { error: error.message };

  await revalidateMeetingPaths(supabase, meetingId);
  return { success: true };
}

export async function saveLookForwardResponse(
  meetingId: string,
  data: {
    obedienceStatement: string;
    sharingCommitment: string;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("lookforward_responses").upsert(
    {
      meeting_id: meetingId,
      user_id: user.id,
      obedience_statement: data.obedienceStatement,
      sharing_commitment: data.sharingCommitment,
    },
    { onConflict: "meeting_id,user_id" }
  );

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
  (lookback ?? []).forEach((r) => userIds.add(r.user_id));
  (lookforward ?? []).forEach((r) => userIds.add(r.user_id));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", Array.from(userIds));
  const names: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    names[p.id] = p.display_name ?? "Member";
  });

  const prayerItems: string[] = [];
  (lookback ?? []).forEach((r) => {
    if (r.pastoral_care_response)
      prayerItems.push(`${names[r.user_id]}: ${r.pastoral_care_response}`);
  });

  const summaryJson = {
    passage,
    lookback: (lookback ?? []).map((r) => ({
      user: names[r.user_id],
      pastoralCare: r.pastoral_care_response,
      accountability: r.accountability_response,
      visionCasting: r.vision_casting_response,
    })),
    lookforward: (lookforward ?? []).map((r) => ({
      user: names[r.user_id],
      obedience: r.obedience_statement,
      sharing: r.sharing_commitment,
    })),
    observations: observations ?? [],
    priorFollowups: priorFollowups ?? [],
    practice: practice ?? [],
  };

  const prayerSummary = prayerItems.join("\n\n") || "No specific prayer requests recorded.";

  const { error } = await supabase.from("meeting_summaries").upsert(
    {
      meeting_id: meetingId,
      summary_json: summaryJson,
      prayer_summary: prayerSummary,
    },
    { onConflict: "meeting_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}`);
  revalidatePath(`/app/groups/${meeting.group_id}/meetings/${meetingId}/summary`);
  return { success: true };
}
