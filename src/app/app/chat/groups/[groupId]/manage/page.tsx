import { notFound, redirect } from "next/navigation";
import { getGroup } from "@/app/actions/groups";
import { ChatGroupManageView } from "@/components/groups/chat-group-manage-view";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

type GroupFields = {
  archived_at?: string | null;
  group_kind?: string | null;
  admin_user_id?: string | null;
};

export default async function ChatGroupManagePage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getGroup(groupId);
  if (result.error || !result.group) {
    if (result.error === "Not a member of this group") redirect("/app");
    notFound();
  }

  const { group, role } = result;
  const g = group as typeof group & GroupFields;
  const groupKind = g.group_kind ?? "thirds";
  if (groupKind !== "chat") {
    redirect(`/app/groups/${groupId}`);
  }

  const isArchived = g.archived_at != null && String(g.archived_at).length > 0;
  const canManageGroup =
    role === "admin" ||
    Boolean(g.admin_user_id && user.id === g.admin_user_id);

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const memberCount = count ?? 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const senderDisplayName =
    profile?.display_name?.trim() || user.email?.split("@")[0]?.trim() || "A friend";

  return (
    <ChatGroupManageView
      groupId={groupId}
      groupName={group.name}
      description={group.description}
      isArchived={isArchived}
      canManageGroup={canManageGroup}
      memberCount={memberCount}
      currentUserId={user.id}
      senderDisplayName={senderDisplayName}
    />
  );
}
