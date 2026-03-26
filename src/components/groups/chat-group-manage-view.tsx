import Link from "next/link";
import { getChatGroupWorkspace } from "@/app/actions/chat-groups";
import { ChatGroupPlanSection } from "@/components/groups/chat-group-plan-section";
import { GroupWorkspaceManageSection } from "@/components/groups/group-workspace-manage-section";
import { ShareChatGroupSheet } from "@/components/groups/share-chat-group-sheet";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export async function ChatGroupManageView({
  groupId,
  groupName,
  description,
  isArchived,
  canManageGroup,
  memberCount,
  currentUserId,
  senderDisplayName,
}: {
  groupId: string;
  groupName: string;
  description?: string | null;
  isArchived: boolean;
  canManageGroup: boolean;
  memberCount: number;
  currentUserId: string;
  senderDisplayName: string;
}) {
  const ws = await getChatGroupWorkspace(groupId);
  if ("error" in ws) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-destructive text-sm">{ws.error}</p>
        <Link href="/app/chat" className="text-sm text-muted-foreground hover:underline">
          ← CHAT
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/app/chat/groups/${groupId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to meeting
        </Link>
        <ShareChatGroupSheet senderDisplayName={senderDisplayName} />
      </div>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Manage CHAT group
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">{groupName}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="rounded-full border border-border bg-violet-100/80 px-2 py-0.5 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
            CHAT
          </span>
          <span className="text-sm text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? "s" : ""} · max 3
          </span>
        </div>
      </header>

      {isArchived && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
          <p className="font-medium">This group is archived</p>
          <p className="mt-1 text-muted-foreground">
            It is hidden from your CHAT page list. You can still open it from this link.
          </p>
        </div>
      )}

      {memberCount < 2 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Invite one or two others so you can agree on a weekly time and reading plan
            together.
          </p>
          <Link
            href={`/app/groups/${groupId}/members`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Members & invites
          </Link>
        </div>
      )}

      <ChatGroupPlanSection
        groupId={groupId}
        currentUserId={currentUserId}
        workspace={ws}
      />

      <section>
        <Link
          href={`/app/groups/${groupId}/members`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Members & invites
        </Link>
      </section>

      {canManageGroup && (
        <GroupWorkspaceManageSection
          groupId={groupId}
          groupName={groupName}
          variant={isArchived ? "archived" : "active"}
          workspace="chat"
        />
      )}
    </div>
  );
}
