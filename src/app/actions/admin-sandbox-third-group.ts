"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createGroup, deleteGroup } from "@/app/actions/groups";
import { ensureStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { createGroupMeeting } from "@/app/actions/meetings";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";
import { ADMIN_SANDBOX_THIRDS_GROUP_NAME, type AdminSandboxThirdsScenario } from "@/lib/admin/admin-sandbox-third-constants";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminTesterOk = {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  user: { id: string; email?: string | null };
};

async function requireAdminTester(): Promise<AdminTesterOk | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isBadwrAdminTestUser(user)) return { error: "Not authorized" };
  return { supabase, user };
}

async function findSandboxGroupId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("groups")
    .select("id")
    .eq("admin_user_id", userId)
    .eq("badwr_admin_sandbox", true)
    .maybeSingle();
  return data?.id ?? null;
}

async function assertOwnSandboxGroup(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: mem } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!mem) return { error: "Not a member of this group." };

  const { data: g } = await supabase
    .from("groups")
    .select("id, admin_user_id, badwr_admin_sandbox")
    .eq("id", groupId)
    .single();

  if (!g?.badwr_admin_sandbox || g.admin_user_id !== userId) {
    return { error: "Not an admin sandbox group you own." };
  }
  return { ok: true };
}

function ymdOffsetDays(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function insertSandboxManualMeeting(
  groupId: string,
  input: { meetingDate: string; title: string; status: "draft" | "active" | "completed" }
): Promise<{ meetingId: string } | { error: string }> {
  const res = await createGroupMeeting(groupId, {
    meetingDate: input.meetingDate,
    title: input.title,
    storySourceType: "manual_passage",
    book: "John",
    chapter: 3,
    verseStart: 16,
    verseEnd: 18,
  });
  if ("error" in res && res.error) return { error: res.error };
  if (!("meetingId" in res) || !res.meetingId) return { error: "Failed to create meeting." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("group_meetings")
    .update({ status: input.status })
    .eq("id", res.meetingId);
  if (error) return { error: error.message };
  return { meetingId: res.meetingId };
}

async function seedSandboxInvites(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  mode: "full" | "minimal"
) {
  const rows =
    mode === "minimal"
      ? [
          {
            email: "sandbox.pending.one@example.invalid",
            invitee_name: "Pat Pendington",
            status: "pending" as const,
            expiresOffsetDays: 10,
          },
        ]
      : [
          {
            email: "sandbox.pending.one@example.invalid",
            invitee_name: "Pat Pendington",
            status: "pending" as const,
            expiresOffsetDays: 10,
          },
          {
            email: "sandbox.pending.two@example.invalid",
            invitee_name: "Riley Requested",
            status: "pending" as const,
            expiresOffsetDays: 8,
          },
          {
            email: "sandbox.expired@example.invalid",
            invitee_name: "Casey Expiredson",
            status: "expired" as const,
            expiresOffsetDays: -3,
          },
        ];

  for (const r of rows) {
    const token = randomBytes(24).toString("hex");
    const exp = new Date();
    exp.setDate(exp.getDate() + r.expiresOffsetDays);
    await supabase.from("group_invites").insert({
      group_id: groupId,
      email: r.email,
      invitee_name: r.invitee_name,
      invited_by_user_id: userId,
      invited_by_name: "Sandbox facilitator",
      token,
      status: r.status,
      expires_at: exp.toISOString(),
      last_sent_at: new Date().toISOString(),
    });
  }
}

async function seedSandboxScenario(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  scenario: AdminSandboxThirdsScenario
): Promise<{ error?: string }> {
  const base = new Date();

  switch (scenario) {
    case "empty":
      return {};
    case "first_meeting": {
      const r = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 0),
        title: "Sandbox — First group meeting",
        status: "draft",
      });
      if ("error" in r) return { error: r.error };
      await seedSandboxInvites(supabase, groupId, userId, "minimal");
      return {};
    }
    case "active_only": {
      const r = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 0),
        title: "Sandbox — Active meeting",
        status: "active",
      });
      return "error" in r ? { error: r.error } : {};
    }
    case "completed_only": {
      const r = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, -7),
        title: "Sandbox — Completed meeting",
        status: "completed",
      });
      return "error" in r ? { error: r.error } : {};
    }
    case "partial_draft": {
      const r = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 1),
        title: "Sandbox — Partially started draft",
        status: "draft",
      });
      if ("error" in r) return { error: r.error };
      await supabase.from("lookback_responses").insert({
        meeting_id: r.meetingId,
        user_id: userId,
        pastoral_care_response:
          "Sandbox sample: God provided peace after a stressful week.",
        accountability_response: "",
        vision_casting_response: "",
      });
      return {};
    }
    case "full": {
      const a = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, -21),
        title: "Sandbox — Completed (Look Back / Care sample)",
        status: "completed",
      });
      if ("error" in a) return { error: a.error };

      await supabase.from("lookback_responses").insert({
        meeting_id: a.meetingId,
        user_id: userId,
        pastoral_care_response: "Sandbox: celebrating a new job.",
        accountability_response: "Sandbox: followed through on prayer walks.",
        vision_casting_response: "Sandbox: clarity on serving neighbors.",
      });

      const b = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 0),
        title: "Sandbox — Active meeting (try presenter)",
        status: "active",
      });
      if ("error" in b) return { error: b.error };

      const c = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 2),
        title: "Sandbox — Empty draft (upcoming)",
        status: "draft",
      });
      if ("error" in c) return { error: c.error };

      const d = await insertSandboxManualMeeting(groupId, {
        meetingDate: ymdOffsetDays(base, 3),
        title: "Sandbox — Partial draft",
        status: "draft",
      });
      if ("error" in d) return { error: d.error };

      await supabase.from("lookback_responses").insert({
        meeting_id: d.meetingId,
        user_id: userId,
        pastoral_care_response: "Sandbox partial response only.",
        accountability_response: "",
        vision_casting_response: "",
      });

      await seedSandboxInvites(supabase, groupId, userId, "full");
      return {};
    }
    default:
      return { error: "Unknown scenario." };
  }
}

export async function getAdminSandboxThirdsGroupIdForTester(): Promise<{
  groupId: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) return { groupId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isBadwrAdminTestUser(user)) return { groupId: null };
  const id = await findSandboxGroupId(supabase, user.id);
  return { groupId: id };
}

export async function ensureAdminSandboxThirdsGroup(options?: {
  scenario?: AdminSandboxThirdsScenario;
}): Promise<{ groupId: string } | { error: string }> {
  const scenario = options?.scenario ?? "full";
  const ctx = await requireAdminTester();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user } = ctx;

  let groupId = await findSandboxGroupId(supabase, user.id);

  if (!groupId) {
    const created = await createGroup({
      name: ADMIN_SANDBOX_THIRDS_GROUP_NAME,
      description: "Admin-only sandbox — safe QA. No real invites; streaks disabled.",
    });
    if ("error" in created && created.error) return { error: created.error };
    if (!("groupId" in created) || !created.groupId) return { error: "Failed to create sandbox group." };
    groupId = created.groupId;

    const { error: upErr } = await supabase
      .from("groups")
      .update({
        badwr_admin_sandbox: true,
        onboarding_pending: false,
        starter_track_prompt_answered: true,
        onboarding_path: "experienced",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", groupId);
    if (upErr) return { error: upErr.message };

    const seeded = await seedSandboxScenario(supabase, user.id, groupId, scenario);
    if (seeded.error) return { error: seeded.error };
  }

  revalidatePath("/app/groups");
  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/admin/test-mode");
  return { groupId };
}

export async function resetAdminSandboxThirdsGroup(): Promise<
  { groupId: string } | { error: string }
> {
  const ctx = await requireAdminTester();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user } = ctx;

  const existing = await findSandboxGroupId(supabase, user.id);
  if (existing) {
    const del = await deleteGroup(existing);
    if ("error" in del && del.error) return { error: del.error };
  }

  return ensureAdminSandboxThirdsGroup({ scenario: "full" });
}

export async function applyAdminSandboxThirdsScenario(
  groupId: string,
  scenario: AdminSandboxThirdsScenario
): Promise<{ ok: true } | { error: string }> {
  const ctx = await requireAdminTester();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user } = ctx;

  const gate = await assertOwnSandboxGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  const { error: delM } = await supabase.from("group_meetings").delete().eq("group_id", groupId);
  if (delM) return { error: delM.message };

  const { error: delI } = await supabase.from("group_invites").delete().eq("group_id", groupId);
  if (delI) return { error: delI.message };

  const seeded = await seedSandboxScenario(supabase, user.id, groupId, scenario);
  if (seeded.error) return { error: seeded.error };

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/meetings`);
  revalidatePath("/app/admin/test-mode");
  return { ok: true };
}

export async function setAdminSandboxStarterTrackMode(
  groupId: string,
  mode: "starter" | "experienced"
): Promise<{ ok: true } | { error: string }> {
  const ctx = await requireAdminTester();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user } = ctx;

  const gate = await assertOwnSandboxGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  if (mode === "starter") {
    const vision =
      "We want friends and neighbors to discover Jesus through a steady 3/3rds rhythm and simple obedience.";

    const { error: gErr } = await supabase
      .from("groups")
      .update({
        onboarding_path: "starter_track",
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);
    if (gErr) return { error: gErr.message };

    const en = await ensureStarterTrackEnrollment(groupId);
    if (en.error) return { error: en.error };

    const { error: eErr } = await supabase
      .from("group_starter_track_enrollment")
      .update({
        intro_completed_at: new Date().toISOString(),
        vision_statement: vision,
        vision_completed_at: new Date().toISOString(),
        weeks_completed: 0,
      })
      .eq("group_id", groupId);
    if (eErr) return { error: eErr.message };
  } else {
    const { error: delE } = await supabase
      .from("group_starter_track_enrollment")
      .delete()
      .eq("group_id", groupId);
    if (delE) return { error: delE.message };

    const { error: gErr } = await supabase
      .from("groups")
      .update({
        onboarding_path: "experienced",
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);
    if (gErr) return { error: gErr.message };
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/starter-track`);
  return { ok: true };
}
