/**
 * Canonical user id for maps (Supabase auth + DB UUIDs are case-insensitive;
 * JS object keys are not — mismatches caused "Member" and empty live sections).
 */
export function normalizeMeetingUserId(
  id: string | null | undefined
): string | null {
  if (id == null || typeof id !== "string") return null;
  const t = id.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

/**
 * Resolve a member's display label for group UIs when `profiles.display_name`
 * may be unreadable for peers under RLS. Falls back to `group_members` names
 * and email local-part (same pattern as getGroupMembers).
 */
export type GroupMemberNameRow = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export function mapGroupMembersByUserId(
  rows: {
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  }[]
): Record<string, GroupMemberNameRow> {
  const out: Record<string, GroupMemberNameRow> = {};
  for (const m of rows) {
    const k = normalizeMeetingUserId(m.user_id);
    if (k) out[k] = m;
  }
  return out;
}

export function resolveMemberDisplayName(
  _userId: string,
  profileDisplayName: string | null | undefined,
  gm: GroupMemberNameRow | undefined
): string {
  const pn =
    typeof profileDisplayName === "string" ? profileDisplayName.trim() : "";
  if (pn) return pn;
  const fromGm = [gm?.first_name, gm?.last_name].filter(Boolean).join(" ").trim();
  if (fromGm) return fromGm;
  const em = gm?.email?.trim().toLowerCase();
  if (em) {
    const at = em.indexOf("@");
    const local = (at > 0 ? em.slice(0, at) : em).trim();
    if (local) {
      const pretty = local.replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
      return pretty || local;
    }
  }
  return "Member";
}

/** Client + server: prefer full group map from `getMeetingDetail`, then participant row. */
export function displayNameForMeetingUser(
  userId: string | null | undefined,
  memberDisplayNames: Record<string, string>,
  participants?: { user_id: string; display_name: string }[]
): string {
  const id = normalizeMeetingUserId(userId);
  if (!id) return "Member";
  const fromMap = memberDisplayNames[id]?.trim();
  if (fromMap) return fromMap;
  const fromParticipant = participants
    ?.find((p) => normalizeMeetingUserId(p.user_id) === id)
    ?.display_name?.trim();
  if (fromParticipant) return fromParticipant;
  return "Member";
}
