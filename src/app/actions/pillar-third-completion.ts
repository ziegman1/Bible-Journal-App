"use server";

import { revalidatePath } from "next/cache";
import { pillarWeekStartKeyFromDateYmd } from "@/lib/dashboard/pillar-week";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

export async function upsertThirdsPillarWeekCompletion(input: {
  pillarWeekStartYmd: string;
  source: string;
  groupId?: string | null;
  meetingId?: string | null;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ymd = input.pillarWeekStartYmd.trim().slice(0, 10);

  const { error } = await supabase.from("pillar_week_streak_completions").upsert(
    {
      user_id: user.id,
      pillar_week_start_ymd: ymd,
      source: input.source,
      group_id: input.groupId ?? null,
      meeting_id: input.meetingId ?? null,
    },
    { onConflict: "user_id,pillar_week_start_ymd" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
  return { success: true };
}

/** After a 3/3rds group meeting is completed: user confirms to count the pillar week. */
export async function recordThirdsCompletionFromGroupMeeting(input: {
  meetingId: string;
  groupId: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: meeting, error: mErr } = await supabase
    .from("group_meetings")
    .select("id, group_id, meeting_date, status")
    .eq("id", input.meetingId)
    .maybeSingle();

  if (mErr) return { error: mErr.message };
  if (!meeting || meeting.group_id !== input.groupId) return { error: "Meeting not found." };
  if (meeting.status !== "completed") {
    return { error: "Mark the meeting complete first." };
  }

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", input.groupId)
    .maybeSingle();
  if (!grp || grp.group_kind !== "thirds") {
    return { error: "This action is for 3/3rds group meetings." };
  }

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", input.groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member of this group." };

  const tz = await getPracticeTimeZone();
  const meetingYmd = String(meeting.meeting_date).slice(0, 10);
  const pillarWeek = pillarWeekStartKeyFromDateYmd(meetingYmd, tz);

  const res = await upsertThirdsPillarWeekCompletion({
    pillarWeekStartYmd: pillarWeek,
    source: "group_meeting",
    groupId: input.groupId,
    meetingId: input.meetingId,
  });
  if ("success" in res) {
    revalidatePath(`/app/groups/${input.groupId}/meetings/${input.meetingId}/summary`);
  }
  return res;
}
