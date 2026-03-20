"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

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
  console.error("🔥 SERVER ACTION HIT 🔥");
  console.error("🔥 ENV CHECK 🔥", {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyLength: process.env.RESEND_API_KEY?.length ?? 0,
  });

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

  // Expire any existing pending invite for this email so we can resend
  await supabase
    .from("group_invites")
    .update({ status: "expired" })
    .eq("group_id", groupId)
    .eq("email", emailNorm)
    .eq("status", "pending");

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

  const { data: invite, error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      email: email.trim().toLowerCase(),
      invitee_name: inviteeName?.trim() || null,
      invited_by_user_id: user.id,
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token, expires_at")
    .single();

  if (error) return { error: error.message };

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/app/groups/invite/${invite.token}`;

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // TEMP DEBUG: env at action layer before email send. Remove after diagnosis.
  console.debug("[invite-action] inviteGroupMember before sendGroupInviteEmail:", {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyLength: process.env.RESEND_API_KEY?.length ?? 0,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });

  const { sendGroupInviteEmail } = await import("@/lib/email");
  const emailResult = await sendGroupInviteEmail({
    to: email.trim().toLowerCase(),
    inviteeName: inviteeName?.trim() || "",
    groupName: group?.name ?? "the group",
    inviterName: inviterProfile?.display_name ?? "A group admin",
    acceptUrl,
  });

  if (!emailResult.success) {
    revalidatePath(`/app/groups/${groupId}`);
    revalidatePath(`/app/groups/${groupId}/members`);
    return {
      success: true,
      inviteId: invite.id,
      acceptUrl,
      expiresAt: invite.expires_at,
      emailSent: false,
      emailError: emailResult.error,
    };
  }

  revalidatePath(`/app/groups/${groupId}`);
  revalidatePath(`/app/groups/${groupId}/members`);
  return {
    success: true,
    inviteId: invite.id,
    acceptUrl,
    expiresAt: invite.expires_at,
    emailSent: true,
  };
}

const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Please sign in to accept this invitation.",
  INVALID_TOKEN: "Invalid or expired invite link.",
  ALREADY_ACCEPTED: "This invite has already been used.",
  EXPIRED: "This invite has expired.",
  EMAIL_MISMATCH: "This invite was sent to a different email address.",
  ALREADY_MEMBER: "You are already a member of this group.",
  NEED_NAME: "NEED_NAME",
};

export async function acceptGroupInvite(
  token: string,
  firstName?: string,
  lastName?: string
) {
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
  const res = result as { success?: boolean; group_id?: string; error?: string } | null;
  if (!res) return { error: "Invalid or expired invite" };

  if (res.error) {
    const msg = ACCEPT_ERROR_MESSAGES[res.error] ?? res.error;
    return { error: msg };
  }

  if (res.success && res.group_id) {
    revalidatePath("/app/groups");
    revalidatePath(`/app/groups/${res.group_id}`);
    return { success: true, groupId: res.group_id };
  }

  return { error: "Invalid or expired invite" };
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
