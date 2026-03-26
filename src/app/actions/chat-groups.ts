"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export async function getChatGroupWorkspace(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select(
      "id, name, group_kind, chat_weekday, chat_meeting_time_text, chat_reading_plan"
    )
    .eq("id", groupId)
    .single();

  if (gErr || !group) return { error: "Group not found" as const };
  if (group.group_kind !== "chat") return { error: "Not a CHAT group" as const };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" as const };

  const { data: proposals } = await supabase
    .from("chat_group_proposals")
    .select("*")
    .eq("group_id", groupId)
    .in("status", ["pending_agreement", "active"])
    .order("created_at", { ascending: false });

  const pending = proposals?.find((p) => p.status === "pending_agreement") ?? null;
  const active = proposals?.find((p) => p.status === "active") ?? null;

  let agreements: { user_id: string; agreed: boolean }[] = [];
  if (pending) {
    const { data: agr } = await supabase
      .from("chat_group_proposal_agreements")
      .select("user_id, agreed")
      .eq("proposal_id", pending.id);
    agreements = agr ?? [];
  }

  const { count: memberCount } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { data: memRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const userIds = (memRows ?? [])
    .map((r) => r.user_id)
    .filter(Boolean) as string[];
  const displayByUser: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    (profiles ?? []).forEach((p) => {
      displayByUser[p.id] = p.display_name?.trim() || "Member";
    });
  }
  const members = userIds.map((id) => ({
    userId: id,
    displayName: displayByUser[id] ?? "Member",
  }));

  return {
    group,
    pendingProposal: pending,
    activeProposal: active,
    agreements,
    memberCount: memberCount ?? 0,
    members,
    weekdayLabels: WEEKDAYS,
  };
}

export async function proposeChatGroupPlan(
  groupId: string,
  weekday: number,
  meetingTimeText: string,
  readingPlan: string
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Choose a day of the week" };
  }
  const timeT = meetingTimeText.trim();
  const planT = readingPlan.trim();
  if (!timeT || !planT) return { error: "Meeting time and reading plan are required" };

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member of this group" };

  await supabase
    .from("chat_group_proposals")
    .update({ status: "superseded" })
    .eq("group_id", groupId)
    .eq("status", "pending_agreement");

  const { data: proposal, error } = await supabase
    .from("chat_group_proposals")
    .insert({
      group_id: groupId,
      proposed_by_user_id: user.id,
      weekday,
      meeting_time_text: timeT,
      reading_plan: planT,
      status: "pending_agreement",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/chat");
  return { success: true as const, proposalId: proposal.id };
}

async function tryFinalizeProposal(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  proposalId: string,
  groupId: string
) {
  const { data: proposal } = await supabase
    .from("chat_group_proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("group_id", groupId)
    .single();

  if (!proposal || proposal.status !== "pending_agreement") return;

  const { count: total } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { data: yes } = await supabase
    .from("chat_group_proposal_agreements")
    .select("user_id")
    .eq("proposal_id", proposalId)
    .eq("agreed", true);

  const n = total ?? 0;
  if (n === 0 || (yes?.length ?? 0) < n) return;

  await supabase
    .from("chat_group_proposals")
    .update({ status: "superseded" })
    .eq("group_id", groupId)
    .eq("status", "active");

  await supabase
    .from("chat_group_proposals")
    .update({ status: "active" })
    .eq("id", proposalId);

  await supabase
    .from("groups")
    .update({
      chat_weekday: proposal.weekday,
      chat_meeting_time_text: proposal.meeting_time_text,
      chat_reading_plan: proposal.reading_plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId);
}

export async function agreeToChatProposal(proposalId: string, groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: p } = await supabase
    .from("chat_group_proposals")
    .select("id, group_id, status")
    .eq("id", proposalId)
    .single();
  if (!p || p.group_id !== groupId || p.status !== "pending_agreement") {
    return { error: "This proposal is no longer open for agreement" };
  }

  const { error } = await supabase.from("chat_group_proposal_agreements").upsert(
    {
      proposal_id: proposalId,
      user_id: user.id,
      agreed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "proposal_id,user_id" }
  );

  if (error) return { error: error.message };

  await tryFinalizeProposal(supabase, proposalId, groupId);

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/chat");
  return { success: true as const };
}
