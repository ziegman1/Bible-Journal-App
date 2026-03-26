"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { ensureStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";
import { inviteTokenMeta, logGroupInvite } from "@/lib/group-invite-log";

/** PostgREST sometimes returns a scalar UUID as a one-element array. */
function normalizeRpcUuid(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string" && data.length > 0) return data;
  if (Array.isArray(data) && data[0] != null) {
    const s = String(data[0]);
    return s.length > 0 ? s : null;
  }
  return null;
}

export async function createGroup(data: { name: string; description?: string }) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: rawId, error } = await supabase.rpc("create_group_public", {
    p_name: data.name.trim(),
    p_description: data.description?.trim() || null,
  });

  if (error) return { error: error.message };
  const groupId = normalizeRpcUuid(rawId);
  if (!groupId) return { error: "Failed to create group" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name?.trim() || "";
  const [firstName, ...lastParts] = displayName ? displayName.split(/\s+/) : ["", ""];
  const lastName = lastParts.join(" ") || null;

  await supabase
    .from("group_members")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      email: (user.email ?? "").toLowerCase() || null,
    })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  return { success: true, groupId };
}

export async function createChatGroup(data: { name: string; description?: string }) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: rawId, error } = await supabase.rpc("create_chat_group_public", {
    p_name: data.name.trim(),
    p_description: data.description?.trim() || null,
  });

  if (error) {
    const hint =
      error.message?.toLowerCase().includes("create_chat_group_public") ||
      error.message?.toLowerCase().includes("does not exist")
        ? " Ask the app owner to run Supabase migration 035_chat_groups.sql."
        : "";
    return { error: `${error.message}${hint}` };
  }
  const groupId = normalizeRpcUuid(rawId);
  if (!groupId) return { error: "Failed to create CHAT group (invalid response from server)." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name?.trim() || "";
  const [firstName, ...lastParts] = displayName ? displayName.split(/\s+/) : ["", ""];
  const lastName = lastParts.join(" ") || null;

  await supabase
    .from("group_members")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      email: (user.email ?? "").toLowerCase() || null,
    })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  revalidatePath("/app/chat");
  return { success: true as const, groupId: groupId as string };
}

export type StartChatGroupWithInviteResult =
  | { error: string; groupId?: string; inviteFailed?: true }
  | {
      success: true;
      groupId: string;
      inviteId: string;
      token: string;
      acceptUrl: string;
      expiresAt: string;
      lastSentAt: string;
      emailSent: boolean;
      emailError?: string;
    };

/** Create a CHAT group (max 3) and send the first email invite. */
export async function startChatGroupWithInvite(data: {
  groupName: string;
  inviteeEmail: string;
  inviteeName?: string;
}): Promise<StartChatGroupWithInviteResult> {
  const created = await createChatGroup({ name: data.groupName });
  if ("error" in created) {
    return { error: created.error ?? "Failed to create CHAT group" };
  }
  const invite = await inviteGroupMember(
    created.groupId,
    data.inviteeEmail,
    data.inviteeName
  );
  if ("error" in invite) {
    return {
      error: invite.error ?? "Could not send invite",
      groupId: created.groupId,
      inviteFailed: true as const,
    };
  }
  revalidatePath("/app/chat");
  return {
    success: true as const,
    groupId: created.groupId,
    inviteId: invite.inviteId,
    token: invite.token,
    acceptUrl: invite.acceptUrl,
    expiresAt: invite.expiresAt,
    lastSentAt: invite.lastSentAt,
    emailSent: invite.emailSent,
    emailError: invite.emailError,
  };
}

export async function saveGroupOnboardingChoice(
  groupId: string,
  choice: "starter_track" | "experienced"
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: rpcError } = await supabase.rpc("complete_group_onboarding_public", {
    p_group_id: groupId,
    p_path: choice,
  });

  if (rpcError) return { error: rpcError.message };

  const { data: g } = await supabase
    .from("groups")
    .select("onboarding_path")
    .eq("id", groupId)
    .single();

  if (g?.onboarding_path === "starter_track") {
    const en = await ensureStarterTrackEnrollment(groupId);
    if (en.error) return { error: en.error };
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/onboarding`);
  revalidatePath(`/app/groups/${groupId}/starter-track`);

  return {
    success: true as const,
    redirectTo:
      choice === "starter_track"
        ? `/app/groups/${groupId}/starter-track/intro`
        : `/app/groups/${groupId}`,
  };
}

export type ListedGroup = {
  id: string;
  name: string;
  description?: string | null;
  membershipRole: string;
  joinedAt: string;
  archivedAt: string | null;
  /** Admin or original creator — can archive / delete from card menu. */
  canManageGroup: boolean;
  /** `chat` = CHAT accountability (max 3); `thirds` = 3/3rds workspace */
  groupKind: "thirds" | "chat";
};

/** Active groups (default) or archived-only for `/app/groups/archived`. */
export async function listGroupsForUser(options?: {
  archived?: boolean;
  /** `thirds` = 3/3rds list only; `chat` = CHAT only; default `all` */
  groupKind?: "thirds" | "chat" | "all";
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const wantArchived = options?.archived === true;

  type GRow = {
    id: string;
    name: string;
    description?: string | null;
    admin_user_id?: string;
    archived_at?: string | null;
    group_kind?: string | null;
  };

  const selectWithArchive = `
      id,
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        admin_user_id,
        archived_at,
        group_kind,
        created_at,
        updated_at
      )
    `;

  const selectWithoutArchive = `
      id,
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        admin_user_id,
        created_at,
        updated_at
      )
    `;

  const selectWithArchiveNoKind = `
      id,
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        admin_user_id,
        archived_at,
        created_at,
        updated_at
      )
    `;

  type MembershipRow = {
    id: string;
    role: string;
    joined_at: string;
    groups: GRow | GRow[] | null;
  };

  let memberships: MembershipRow[] = [];

  const first = await supabase
    .from("group_members")
    .select(selectWithArchive)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (first.error) {
    const msg = first.error.message.toLowerCase();
    if (msg.includes("group_kind")) {
      const nk = await supabase
        .from("group_members")
        .select(selectWithArchiveNoKind)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      if (!nk.error) memberships = (nk.data ?? []) as MembershipRow[];
    }
    if (memberships.length === 0) {
      const maybeNoArchiveColumn =
        msg.includes("archived_at") ||
        msg.includes("column") ||
        msg.includes("schema cache");
      if (maybeNoArchiveColumn) {
        const second = await supabase
          .from("group_members")
          .select(selectWithoutArchive)
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false });
        if (second.error) return { error: second.error.message };
        memberships = (second.data ?? []) as MembershipRow[];
      } else {
        return { error: first.error.message };
      }
    }
  } else {
    memberships = (first.data ?? []) as MembershipRow[];
  }

  const mapped = (memberships ?? [])
    .map((m) => {
      const raw = m.groups as GRow | GRow[] | null;
      const g = Array.isArray(raw) ? raw[0] : raw;
      if (!g) return null;
      const archivedAt = g.archived_at ?? null;
      const isArchived = archivedAt != null;
      if (wantArchived !== isArchived) return null;

      const canManageGroup =
        m.role === "admin" ||
        Boolean(g.admin_user_id && g.admin_user_id === user.id);

      const groupKind: "thirds" | "chat" =
        g.group_kind === "chat" ? "chat" : "thirds";

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        membershipRole: m.role,
        joinedAt: m.joined_at,
        archivedAt,
        canManageGroup,
        groupKind,
      };
    })
    .filter(Boolean) as ListedGroup[];

  const kindFilter = options?.groupKind ?? "all";
  let filtered = mapped;
  if (kindFilter === "thirds") {
    filtered = mapped.filter((g) => g.groupKind === "thirds");
  } else if (kindFilter === "chat") {
    filtered = mapped.filter((g) => g.groupKind === "chat");
  }

  return { groups: filtered };
}

export async function getGroup(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error || !group) return { error: error?.message ?? "Group not found" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "Not a member of this group" };

  return { group, role: membership.role };
}

async function assertCanManageGroup(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  groupId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("admin_user_id")
    .eq("id", groupId)
    .single();

  if (gErr || !group) return { error: "Group not found" };

  const { data: membership, error: memErr } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (memErr || !membership) return { error: "Not a member of this group" };

  const isCreator = group.admin_user_id === userId;
  const isAdmin = membership.role === "admin";
  if (!isAdmin && !isCreator) {
    return { error: "Only a group admin or the creator can do this." };
  }
  return { ok: true };
}

export async function updateGroupName(groupId: string, name: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const gate = await assertCanManageGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };
  if (trimmed.length > 120) {
    return { error: "Keep the name under 120 characters." };
  }

  const { error } = await supabase
    .from("groups")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  revalidatePath("/app/chat");
  return { success: true as const };
}

/** Admins or original creator may delete (matches RLS). */
export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const gate = await assertCanManageGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  const { error: delErr } = await supabase.from("groups").delete().eq("id", groupId);

  if (delErr) return { error: delErr.message };

  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  revalidatePath(`/app/groups/${groupId}`);
  return { success: true as const };
}

export async function archiveGroup(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const gate = await assertCanManageGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  const { error } = await supabase
    .from("groups")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  revalidatePath(`/app/groups/${groupId}`);
  return { success: true as const };
}

export async function unarchiveGroup(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const gate = await assertCanManageGroup(supabase, groupId, user.id);
  if ("error" in gate) return gate;

  const { error } = await supabase
    .from("groups")
    .update({ archived_at: null })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath("/app/groups");
  revalidatePath("/app/groups/archived");
  revalidatePath(`/app/groups/${groupId}`);
  return { success: true as const };
}

export async function inviteGroupMemberFormAction(
  groupId: string,
  _prevState: unknown,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!email) return { error: "Email is required" };
  return inviteGroupMember(groupId, email, name || undefined);
}

export async function inviteGroupMember(
  groupId: string,
  email: string,
  inviteeName?: string
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "Not a member of this group" };

  const { data: groupMeta } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();

  const isChat = groupMeta?.group_kind === "chat";
  if (!isChat && membership.role !== "admin") {
    return { error: "Only group admins can invite members" };
  }

  if (isChat) {
    const { count: memCount } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId);
    const { count: pendCount } = await supabase
      .from("group_invites")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "pending");
    const m = memCount ?? 0;
    const p = pendCount ?? 0;
    if (m + p >= 3) {
      return {
        error:
          "This CHAT group already has three spots filled (members plus pending invites). Cancel a pending invite or wait until someone joins.",
      };
    }
  }

  const emailNorm = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailNorm)) {
    return { error: "Please enter a valid email address" };
  }

  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("email", emailNorm)
    .limit(1)
    .maybeSingle();
  if (existingMember) return { error: "This person is already a member" };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const inviterName = inviterProfile?.display_name?.trim() || "A group admin";

  const sentAt = new Date().toISOString();
  const { data: invite, error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      email: emailNorm,
      invitee_name: inviteeName?.trim() || null,
      invited_by_user_id: user.id,
      invited_by_name: inviterName || null,
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      last_sent_at: sentAt,
    })
    .select("id, token, expires_at, last_sent_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This person already has a pending invite" };
    }
    return { error: error.message };
  }

  const baseUrl = getPublicSiteBaseUrl();
  const acceptUrl = `${baseUrl}/app/groups/invite/${invite.token}`;

  const { data: group } = await supabase
    .from("groups")
    .select("name, group_kind")
    .eq("id", groupId)
    .single();

  const inviteKind = group?.group_kind === "chat" ? "chat" : "thirds";

  const { sendGroupInviteEmail } = await import("@/lib/email");
  const emailResult = await sendGroupInviteEmail({
    to: emailNorm,
    inviteeName: inviteeName?.trim() || "",
    groupName: group?.name ?? "the group",
    inviterName,
    inviterEmail: user.email ?? undefined,
    acceptUrl,
    expiresAt: invite.expires_at,
    inviteKind,
  });

  if (!emailResult.success) {
    revalidatePath(`/app/groups/${groupId}`);
    revalidatePath(`/app/groups/${groupId}/members`);
    return {
      success: true,
      inviteId: invite.id,
      token: invite.token,
      acceptUrl,
      expiresAt: invite.expires_at,
      lastSentAt: invite.last_sent_at,
      emailSent: false,
      emailError: emailResult.error,
    };
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/members`);
  return {
    success: true,
    inviteId: invite.id,
    token: invite.token,
    acceptUrl,
    expiresAt: invite.expires_at,
    lastSentAt: invite.last_sent_at,
    emailSent: true,
  };
}

const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Please sign in to accept this invitation.",
  INVALID_TOKEN: "This invite link is invalid or no longer available.",
  ALREADY_ACCEPTED: "This invite was already used. If you expected to join, contact your group admin.",
  EXPIRED: "This invite has expired. Ask your group admin for a new invite.",
  EMAIL_MISMATCH: "EMAIL_MISMATCH", // replaced with message that includes invited email
  ALREADY_MEMBER: "You are already a member of this group.",
  CANCELLED: "This invite was cancelled by the group admin.",
  NEED_NAME: "NEED_NAME",
  CHAT_GROUP_FULL:
    "This CHAT group already has three members. Ask your friend to start a new group or free a spot.",
};

export type AcceptGroupInviteResult =
  | { success: true; groupId: string; alreadyAccepted?: boolean }
  | {
      error: string;
      code?: string;
      invitedEmail?: string;
    };

function normalizeAcceptInviteRpcPayload(result: unknown): Record<string, unknown> | null {
  if (result == null) return null;
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as unknown;
      return normalizeAcceptInviteRpcPayload(parsed);
    } catch {
      return null;
    }
  }
  if (Array.isArray(result)) {
    return normalizeAcceptInviteRpcPayload(result[0]);
  }
  if (typeof result === "object") {
    return result as Record<string, unknown>;
  }
  return null;
}

export async function acceptGroupInvite(
  token: string,
  firstName?: string,
  lastName?: string
): Promise<AcceptGroupInviteResult> {
  const trimmed = typeof token === "string" ? token.trim() : "";
  if (!trimmed || trimmed.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    logGroupInvite("accept_invalid_token_shape", inviteTokenMeta(trimmed || "(empty)"));
    return { error: ACCEPT_ERROR_MESSAGES.INVALID_TOKEN, code: "INVALID_TOKEN" };
  }

  const supabase = await createClient();
  if (!supabase) {
    logGroupInvite("accept_no_supabase", inviteTokenMeta(trimmed));
    return { error: "Supabase not configured" };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logGroupInvite("accept_not_authenticated", inviteTokenMeta(trimmed));
    return { error: "Not authenticated", code: "NOT_AUTHENTICATED" };
  }

  const { data: result, error } = await supabase.rpc("accept_group_invite_public", {
    p_token: trimmed,
    p_first_name: firstName?.trim() || null,
    p_last_name: lastName?.trim() || null,
  });

  if (error) {
    logGroupInvite("accept_rpc_error", {
      ...inviteTokenMeta(trimmed),
      userId: user.id,
      message: error.message,
      code: error.code,
    });
    return {
      error: error.message || "Could not process this invite. Please try again.",
      code: "RPC_ERROR",
    };
  }

  const res = normalizeAcceptInviteRpcPayload(result);
  if (!res) {
    logGroupInvite("accept_rpc_null_payload", {
      ...inviteTokenMeta(trimmed),
      userId: user.id,
    });
    return { error: "Invalid or expired invite", code: "INVALID_TOKEN" };
  }

  const errCode =
    typeof res.error === "string" ? res.error : undefined;
  const invitedEmail =
    typeof res.invited_email === "string" ? res.invited_email : undefined;
  const groupId = typeof res.group_id === "string" ? res.group_id : undefined;
  const success = res.success === true;

  if (errCode) {
    logGroupInvite("accept_invite_rejected", {
      ...inviteTokenMeta(trimmed),
      userId: user.id,
      reason: errCode,
    });
    if (errCode === "EMAIL_MISMATCH" && invitedEmail) {
      return {
        error: `This invite was sent to ${invitedEmail}. Sign out and sign in with that email to accept.`,
        code: "EMAIL_MISMATCH",
        invitedEmail,
      };
    }
    const msg = ACCEPT_ERROR_MESSAGES[errCode] ?? errCode;
    return { error: msg, code: errCode };
  }

  if (success && groupId) {
    revalidatePath("/app/groups");
    revalidatePath(`/app/groups/${groupId}`);
    logGroupInvite("accept_success", {
      ...inviteTokenMeta(trimmed),
      userId: user.id,
      groupId,
      alreadyAccepted: !!(res.already_accepted || res.already_member),
    });
    return {
      success: true,
      groupId,
      alreadyAccepted: !!(res.already_accepted || res.already_member),
    };
  }

  logGroupInvite("accept_unexpected_payload", {
    ...inviteTokenMeta(trimmed),
    userId: user.id,
    keys: Object.keys(res),
  });
  return { error: "Invalid or expired invite", code: "INVALID_TOKEN" };
}

export async function cancelGroupInvite(groupId: string, inviteId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const { data: gCancel } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  const chatCancel = gCancel?.group_kind === "chat";

  if (!membership || (!chatCancel && membership.role !== "admin")) {
    return { error: "Only group admins can cancel invites" };
  }

  const { data: updated, error } = await supabase
    .from("group_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) {
    return { error: "Invite not found or already used" };
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/members`);
  return { success: true };
}

export async function resendGroupInvite(groupId: string, inviteId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const { data: gResend } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  const chatResend = gResend?.group_kind === "chat";

  if (!membership || (!chatResend && membership.role !== "admin")) {
    return { error: "Only group admins can resend invites" };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("group_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .single();

  if (fetchErr || !row) return { error: "Invite not found" };
  if (row.status !== "pending") {
    return { error: "Only pending invites can be resent" };
  }

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const inviterName = inviterProfile?.display_name?.trim() || "A group admin";
  const now = new Date();
  let token = row.token as string;
  let expiresAt = new Date(row.expires_at as string);
  let renewed = false;

  if (expiresAt.getTime() <= now.getTime()) {
    token = randomBytes(32).toString("hex");
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    renewed = true;
    const { error: upErr } = await supabase
      .from("group_invites")
      .update({
        token,
        expires_at: expiresAt.toISOString(),
        last_sent_at: now.toISOString(),
        invited_by_user_id: user.id,
        invited_by_name: inviterName || null,
      })
      .eq("id", inviteId)
      .eq("group_id", groupId)
      .eq("status", "pending");

    if (upErr) return { error: upErr.message };
  } else {
    const { error: upErr } = await supabase
      .from("group_invites")
      .update({ last_sent_at: now.toISOString() })
      .eq("id", inviteId)
      .eq("group_id", groupId)
      .eq("status", "pending");

    if (upErr) return { error: upErr.message };
  }

  const baseUrl = getPublicSiteBaseUrl();
  const acceptUrl = `${baseUrl}/app/groups/invite/${token}`;

  const { data: group } = await supabase
    .from("groups")
    .select("name, group_kind")
    .eq("id", groupId)
    .single();

  const inviteKindResend = group?.group_kind === "chat" ? "chat" : "thirds";

  const { sendGroupInviteEmail } = await import("@/lib/email");
  const emailResult = await sendGroupInviteEmail({
    to: String(row.email).trim().toLowerCase(),
    inviteeName: (row.invitee_name as string | null)?.trim() || "",
    groupName: group?.name ?? "the group",
    inviterName,
    inviterEmail: user.email ?? undefined,
    acceptUrl,
    expiresAt: expiresAt.toISOString(),
    inviteKind: inviteKindResend,
  });

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/members`);

  return {
    success: true,
    emailSent: emailResult.success,
    emailError: emailResult.success ? undefined : emailResult.error,
    inviteId,
    token,
    expires_at: expiresAt.toISOString(),
    last_sent_at: now.toISOString(),
    renewed,
    acceptUrl,
    resentToEmail: String(row.email).trim().toLowerCase(),
  };
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: members, error } = await supabase
    .from("group_members")
    .select("id, user_id, role, joined_at, first_name, last_name, email")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) return { error: error.message };

  const userIds = (members ?? []).map((m) => m.user_id).filter(Boolean);
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

  const membersWithNames = (members ?? []).map((m) => {
    const fromMembership = [m.first_name, m.last_name].filter(Boolean).join(" ");
    const displayName =
      fromMembership || displayNames[m.user_id ?? ""] || m.email || "Member";
    return {
      ...m,
      display_name: displayName,
    };
  });

  return { members: membersWithNames };
}

export async function getGroupInvites(groupId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const { data: gInv } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  const chatInv = gInv?.group_kind === "chat";

  if (!membership || (!chatInv && membership.role !== "admin")) {
    return { error: "Only admins can view invites" };
  }

  const { data: invites, error } = await supabase
    .from("group_invites")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return { invites: invites ?? [] };
}

export async function removeGroupMember(groupId: string, memberId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin")
    return { error: "Only admins can remove members" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/members`);
  return { success: true };
}
