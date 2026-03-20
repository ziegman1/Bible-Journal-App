"use client";

import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    membershipRole: string;
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
}

export function GroupCard({ group, nextMeeting, lastMeeting }: GroupCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Link
      href={`/app/groups/${group.id}`}
      className={cn(
        "block rounded-xl border border-stone-200 dark:border-stone-800 p-6",
        "bg-white dark:bg-stone-900/50",
        "hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-stone-500 dark:text-stone-400">
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
          </div>
        </div>
        <Users className="size-5 text-stone-400 shrink-0" />
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        {nextMeeting ? (
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            Next: {formatDate(nextMeeting.meeting_date)}
          </span>
        ) : lastMeeting ? (
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            Last: {formatDate(lastMeeting.meeting_date)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            No meetings yet
          </span>
        )}
      </div>
    </Link>
  );
}
