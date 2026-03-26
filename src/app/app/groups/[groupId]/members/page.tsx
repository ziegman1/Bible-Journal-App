import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getGroupMembers, getGroupInvites } from "@/app/actions/groups";
import { GroupInviteManager } from "@/components/groups/group-invite-manager";
import { GroupMemberList } from "@/components/groups/group-member-list";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupMembersPage({
  params,
  searchParams,
}: PageProps & {
  searchParams: Promise<{ needMembers?: string }>;
}) {
  const { groupId } = await params;
  const { needMembers } = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupResult = await getGroup(groupId);
  if (groupResult.error || !groupResult.group) {
    if (groupResult.error === "Not a member of this group")
      redirect("/app/groups");
    notFound();
  }

  const groupKind = (groupResult.group as { group_kind?: string | null }).group_kind;
  const isChatGroup = groupKind === "chat";
  if (!isChatGroup && groupResult.role !== "admin") {
    redirect(`/app/groups/${groupId}`);
  }

  const [membersResult, invitesResult] = await Promise.all([
    getGroupMembers(groupId),
    getGroupInvites(groupId),
  ]);

  const members = membersResult.members ?? [];
  const invites = invitesResult.invites ?? [];

  const inviteLinkBase = (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    ""
  ).replace(/\/$/, "");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={
            isChatGroup
              ? `/app/chat/groups/${groupId}/manage`
              : `/app/groups/${groupId}`
          }
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to {groupResult.group.name}
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          {members.length < 2 ? "Invite members to the group" : "Manage members"}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
          {isChatGroup
            ? members.length < 2
              ? "CHAT groups work best with 2–3 people. Invite someone by email; you can resend or share the link by text."
              : "Invite up to three people total (members plus pending invites). Agree on reading and meeting time from Manage group once everyone has joined."
            : members.length < 2
              ? "A group must have at least 2 members to start meetings. Invite someone to join."
              : "Invite others and manage group membership."}
        </p>
      </header>

      {needMembers === "1" && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Invite at least one more member before starting a meeting.
        </div>
      )}

      <GroupInviteManager
        groupId={groupId}
        initialInvites={invites}
        inviteLinkBase={inviteLinkBase || undefined}
      />

      <GroupMemberList groupId={groupId} members={members} currentUserId={user.id} />
    </div>
  );
}
