"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  STARTER_TRACK_V1_SLUG,
  type StarterTrackEnrollmentRow,
} from "@/lib/groups/starter-track/types";
import { getStarterWeekConfig } from "@/lib/groups/starter-track/starter-track-v1-config";
import { createGroupMeeting } from "@/app/actions/meetings";

function revalidateStarterPaths(groupId: string) {
  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/starter-track`);
  revalidatePath(`/app/groups/${groupId}/starter-track/intro`);
  revalidatePath(`/app/groups/${groupId}/starter-track/vision`);
  for (let w = 1; w <= 8; w++) {
    revalidatePath(`/app/groups/${groupId}/starter-track/week/${w}`);
  }
}

export async function getStarterTrackEnrollment(groupId: string): Promise<{
  enrollment: StarterTrackEnrollmentRow | null;
  error?: string;
}> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured", enrollment: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", enrollment: null };

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "Not a member of this group", enrollment: null };

  const { data, error } = await supabase
    .from("group_starter_track_enrollment")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) return { error: error.message, enrollment: null };
  return { enrollment: data as StarterTrackEnrollmentRow | null };
}

export async function enrollInStarterTrack(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "Not a member of this group" };

  const { error } = await supabase.from("group_starter_track_enrollment").insert({
    group_id: groupId,
    track_slug: STARTER_TRACK_V1_SLUG,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This group is already enrolled in the Starter Track." };
    }
    return { error: error.message };
  }

  revalidateStarterPaths(groupId);
  return { success: true };
}

export async function completeStarterTrackIntro(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_starter_track_enrollment")
    .update({
      intro_completed_at: new Date().toISOString(),
    })
    .eq("group_id", groupId);

  if (error) return { error: error.message };

  revalidateStarterPaths(groupId);
  return { success: true };
}

const MIN_VISION_LENGTH = 30;

export async function saveStarterTrackVision(groupId: string, statement: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = statement.trim();
  if (trimmed.length < MIN_VISION_LENGTH) {
    return {
      error: `Please write at least ${MIN_VISION_LENGTH} characters so your vision is concrete for the whole group.`,
    };
  }

  const { error } = await supabase
    .from("group_starter_track_enrollment")
    .update({
      vision_statement: trimmed,
      vision_completed_at: new Date().toISOString(),
    })
    .eq("group_id", groupId);

  if (error) return { error: error.message };

  revalidateStarterPaths(groupId);
  return { success: true };
}

export async function createStarterTrackWeekMeeting(groupId: string, week: number) {
  if (week < 1 || week > 8) return { error: "Invalid week" };

  const cfg = getStarterWeekConfig(week);
  if (!cfg) return { error: "Unknown week" };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (!members?.length || members.length < 2) {
    return { error: "Need at least two group members to start a meeting." };
  }

  const { data: en, error: enErr } = await supabase
    .from("group_starter_track_enrollment")
    .select("weeks_completed, vision_completed_at")
    .eq("group_id", groupId)
    .single();

  if (enErr || !en) return { error: "Starter Track not found for this group." };
  if (!en.vision_completed_at) {
    return { error: "Complete your group vision statement before starting Week 1." };
  }
  if (week !== en.weeks_completed + 1) {
    return {
      error: `Finish Week ${en.weeks_completed} first (or complete that week’s meeting).`,
    };
  }

  const meetingDate = new Date().toISOString().slice(0, 10);
  const title = `Starter Track — ${cfg.title}`;
  const p = cfg.primaryPassage;

  const result = await createGroupMeeting(groupId, {
    meetingDate,
    title,
    storySourceType: "manual_passage",
    book: p.book,
    chapter: p.chapter,
    verseStart: p.verseStart,
    verseEnd: p.verseEnd,
    starterTrackWeek: week,
  });

  if (result.error) return { error: result.error };
  return { success: true, meetingId: result.meetingId };
}
