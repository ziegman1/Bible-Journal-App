"use client";

import { GroupManageMenu } from "@/components/groups/group-manage-menu";

interface Props {
  groupId: string;
  groupName: string;
  variant: "active" | "archived";
  /** 3/3rds workspaces use `/app/groups`; CHAT uses `/app/chat` after archive/delete. */
  workspace?: "thirds" | "chat";
}

/** Archive / restore / delete — same actions as the ⋯ menu on group cards. */
export function GroupWorkspaceManageSection({
  groupId,
  groupName,
  variant,
  workspace = "thirds",
}: Props) {
  const hub =
    workspace === "chat"
      ? "/app/chat"
      : variant === "archived"
        ? "/app/groups/archived"
        : "/app/groups";

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-3">
      <h2 className="text-sm font-medium text-stone-800 dark:text-stone-200">
        Manage group
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {workspace === "chat" ? (
          <>
            Archive hides this CHAT group from your{" "}
            <span className="font-medium text-stone-700 dark:text-stone-300">
              CHAT
            </span>{" "}
            page list. Delete removes it permanently for everyone.
          </>
        ) : (
          <>
            Archive hides this group from your main 3/3rds list (see{" "}
            <span className="font-medium text-stone-700 dark:text-stone-300">
              3/3rds Groups → Archived 3/3rds
            </span>
            ). Delete removes it permanently for everyone.
          </>
        )}
      </p>
      <GroupManageMenu
        groupId={groupId}
        groupName={groupName}
        variant={variant}
        trigger="labeled"
        afterDeleteHref={hub}
        afterArchiveHref={workspace === "chat" ? "/app/chat" : "/app/groups"}
      />
    </section>
  );
}
