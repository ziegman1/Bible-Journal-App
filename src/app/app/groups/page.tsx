import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { GroupCard } from "@/components/groups/group-card";
import { ThirdsParticipationPanel } from "@/components/groups/thirds-participation-panel";
import { Button } from "@/components/ui/button";
import { Archive, Plus } from "lucide-react";

export default async function GroupsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await listGroupsForUser({ groupKind: "thirds" });
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
      const nextMeeting = meetings.find((m) => m.status === "draft" || m.status === "active");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          3/3rds Groups
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/groups/archived">
            <Button variant="outline" size="sm">
              <Archive className="size-4 mr-2" />
              Archived 3/3rds
            </Button>
          </Link>
          <Link href="/app/groups/personal-thirds">
            <Button variant="outline" size="sm">
              Solo 3/3rds
            </Button>
          </Link>
          <Link href="/app/groups/new">
            <Button>
              <Plus className="size-4 mr-2" />
              Create Group
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-stone-600 dark:text-stone-400 text-sm">
        These workspaces use Look Back, Look Up, and Look Forward in meetings.{" "}
        <strong>CHAT accountability groups</strong> live on the{" "}
        <Link href="/app/chat" className="font-medium text-stone-800 underline underline-offset-2 dark:text-stone-200">
          CHAT
        </Link>{" "}
        page. If you’re a <strong>group admin</strong> or the <strong>creator</strong>,
        use the <span className="whitespace-nowrap">⋯</span> menu on a card to archive or
        delete.
      </p>

      <ThirdsParticipationPanel />

      {groupsWithMeetings.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-card">
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            You are not in any 3/3rds groups yet.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/app/groups/new">
              <Button>
                <Plus className="size-4 mr-2" />
                Create your first group
              </Button>
            </Link>
            <Link href="/app/groups/personal-thirds">
              <Button variant="outline">Solo 3/3rds (no group)</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupsWithMeetings.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              nextMeeting={group.nextMeeting}
              lastMeeting={group.lastMeeting}
            />
          ))}
        </div>
      )}

      {process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ? (
        <p
          className="text-[10px] text-stone-400 dark:text-stone-500 pt-4 border-t border-border font-mono"
          title="If this is empty on logosflow.app but shows an id on biblejournalapp.vercel.app, the custom domain is pointed at a different deployment."
        >
          Deploy: {process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID}
        </p>
      ) : null}
    </div>
  );
}
