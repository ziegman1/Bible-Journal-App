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
              ? "Invite others for the full 3/3rds rhythm. As admin you can still start draft meetings while you’re the only member."
              : "Invite others and manage group membership."}
        </p>
      </header>

      {needMembers === "1" && !isChatGroup && members.length < 2 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Add members here when you’re ready. From the group workspace you can also
          start a draft meeting while you’re the only member.
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
