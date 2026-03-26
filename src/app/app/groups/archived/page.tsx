import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { GroupCard } from "@/components/groups/group-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Archive } from "lucide-react";

export default async function ArchivedGroupsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await listGroupsForUser({ archived: true, groupKind: "thirds" });
  if (result.error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-amber-600 dark:text-amber-400">{result.error}</p>
      </div>
    );
  }

  const groups = result.groups ?? [];
  const groupsWithMeetings = await Promise.all(
    groups.map(async (g) => {
      const mResult = await listGroupMeetings(g.id);
      const meetings = mResult.meetings ?? [];
      const nextMeeting = meetings.find(
        (m) => m.status === "draft" || m.status === "active"
      );
      const lastMeeting = meetings.find((m) => m.status === "completed");
      return {
        ...g,
        nextMeeting: nextMeeting ?? null,
        lastMeeting: lastMeeting ?? null,
      };
    })
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/app/groups"
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← 3/3rds Groups
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Archive className="size-8 text-stone-500 shrink-0" />
          <div>
            <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
              Archived 3/3rds groups
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              3/3rds workspaces you’ve archived stay here. Restore anytime, or delete
              permanently. CHAT groups are listed under{" "}
              <Link
                href="/app/chat"
                className="font-medium text-stone-800 underline underline-offset-2 dark:text-stone-200"
              >
                CHAT
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {groupsWithMeetings.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-card">
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            No archived 3/3rds groups.
          </p>
          <Link
            href="/app/groups"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to 3/3rds Groups
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groupsWithMeetings.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              nextMeeting={group.nextMeeting}
              lastMeeting={group.lastMeeting}
              variant="archived"
              afterDeleteHref="/app/groups/archived"
            />
          ))}
        </div>
      )}
    </div>
  );
}
