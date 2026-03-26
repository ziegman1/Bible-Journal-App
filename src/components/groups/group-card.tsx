"use client";

import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupManageMenu } from "@/components/groups/group-manage-menu";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    membershipRole: string;
    canManageGroup?: boolean;
    /** From server list; omit on older payloads → treated as 3/3rds */
    groupKind?: "thirds" | "chat";
  };
  nextMeeting?: {
    id: string;
    meeting_date: string;
    status: string;
    title?: string | null;
  } | null;
  lastMeeting?: {
    id: string;
    meeting_date: string;
    status: string;
  } | null;
  variant?: "active" | "archived";
  /** Passed to delete redirect when variant is archived */
  afterDeleteHref?: string;
  afterArchiveHref?: string;
}

export function GroupCard({
  group,
  nextMeeting,
  lastMeeting,
  variant = "active",
  afterDeleteHref,
  afterArchiveHref,
}: GroupCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  /** Admin/creator server flag; if older clients omit it, still show ⋯ for admins. */
  const showOptions =
    group.canManageGroup === true ||
    (group.canManageGroup === undefined && group.membershipRole === "admin");

  return (
    <div
      className={cn(
        "rounded-xl border border-border",
        "bg-white dark:bg-stone-900/50",
        "hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
      )}
    >
      <div className="flex items-start gap-2 p-6 pb-4">
        <Link
          href={
            group.groupKind === "chat"
              ? `/app/chat/groups/${group.id}`
              : `/app/groups/${group.id}`
          }
          className="min-w-0 flex-1 block"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
                  {group.name}
                </h2>
                {group.groupKind === "chat" && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-violet-300/80 bg-violet-100/90 text-violet-900 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                    CHAT
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-stone-500 dark:text-stone-400">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full",
                    group.membershipRole === "admin"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  )}
                >
                  {group.membershipRole}
                </span>
                {variant === "archived" && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                    Archived
                  </span>
                )}
              </div>
            </div>
            <Users className="size-5 text-stone-400 shrink-0 hidden sm:block" />
          </div>
        </Link>
        {showOptions && (
          <GroupManageMenu
            groupId={group.id}
            groupName={group.name}
            variant={variant}
            afterDeleteHref={afterDeleteHref}
            afterArchiveHref={afterArchiveHref}
          />
        )}
      </div>

      <Link
        href={
          group.groupKind === "chat"
            ? `/app/chat/groups/${group.id}`
            : `/app/groups/${group.id}`
        }
        className="block px-6 pb-6 pt-0"
      >
        <div className="pt-4 border-t border-border flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          {nextMeeting ? (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" />
              Next: {formatDate(nextMeeting.meeting_date)}
            </span>
          ) : lastMeeting ? (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" />
              Last: {formatDate(lastMeeting.meeting_date)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" />
              No meetings yet
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
