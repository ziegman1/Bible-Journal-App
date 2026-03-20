"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function getPublicSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function createGroup(data: { name: string; description?: string }) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: groupId, error } = await supabase.rpc("create_group_public", {
    p_name: data.name.trim(),
    p_description: data.description?.trim() || null,
  });

  if (error) return { error: error.message };
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
  return { success: true, groupId };
}

export async function listGroupsForUser() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: memberships, error } = await supabase
    .from("group_members")
    .select(
      `
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
    `
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) return { error: error.message };

  const groups = (memberships ?? []).map((m) => {
    const raw = m.groups as { id: string; name: string; description?: string | null } | { id: string; name: string; description?: string | null }[] | null;
    const g = Array.isArray(raw) ? raw[0] : raw;
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      membershipRole: m.role,
      joinedAt: m.joined_at,
    };
  }).filter(Boolean) as { id: string; name: string; description?: string | null; membershipRole: string; joinedAt: string }[];

  return { groups };
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

  if (!membership || membership.role !== "admin")
    return { error: "Only group admins can invite members" };

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
    .select("name")
    .eq("id", groupId)
    .single();

  const { sendGroupInviteEmail } = await import("@/lib/email");
  const emailResult = await sendGroupInviteEmail({
    to: emailNorm,
    inviteeName: inviteeName?.trim() || "",
    groupName: group?.name ?? "the group",
    inviterName,
    inviterEmail: user.email ?? undefined,
    acceptUrl,
    expiresAt: invite.expires_at,
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
};

export type AcceptGroupInviteResult =
  | { success: true; groupId: string; alreadyAccepted?: boolean }
  | {
      error: string;
      code?: string;
      invitedEmail?: string;
    };

export async function acceptGroupInvite(
  token: string,
  firstName?: string,
  lastName?: string
): Promise<AcceptGroupInviteResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: result, error } = await supabase.rpc("accept_group_invite_public", {
    p_token: token.trim(),
    p_first_name: firstName?.trim() || null,
    p_last_name: lastName?.trim() || null,
  });

  if (error) return { error: error.message };
  const res = result as {
    success?: boolean;
    group_id?: string;
    error?: string;
    invited_email?: string;
    already_accepted?: boolean;
    already_member?: boolean;
  } | null;
  if (!res) return { error: "Invalid or expired invite", code: "INVALID_TOKEN" };

  if (res.error) {
    if (res.error === "EMAIL_MISMATCH" && res.invited_email) {
      return {
        error: `This invite was sent to ${res.invited_email}. Sign out and sign in with that email to accept.`,
        code: "EMAIL_MISMATCH",
        invitedEmail: res.invited_email,
      };
    }
    const msg = ACCEPT_ERROR_MESSAGES[res.error] ?? res.error;
    return { error: msg, code: res.error };
  }

  if (res.success && res.group_id) {
    revalidatePath("/app/groups");
    revalidatePath(`/app/groups/${res.group_id}`);
    return {
      success: true,
      groupId: res.group_id,
      alreadyAccepted: !!(res.already_accepted || res.already_member),
    };
  }

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

  if (!membership || membership.role !== "admin") {
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

  if (!membership || membership.role !== "admin") {
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
    .select("name")
    .eq("id", groupId)
    .single();

  const { sendGroupInviteEmail } = await import("@/lib/email");
  const emailResult = await sendGroupInviteEmail({
    to: String(row.email).trim().toLowerCase(),
    inviteeName: (row.invitee_name as string | null)?.trim() || "",
    groupName: group?.name ?? "the group",
    inviterName,
    inviterEmail: user.email ?? undefined,
    acceptUrl,
    expiresAt: expiresAt.toISOString(),
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

  if (!membership || membership.role !== "admin")
    return { error: "Only admins can view invites" };

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
