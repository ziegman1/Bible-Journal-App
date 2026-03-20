import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function GroupsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await listGroupsForUser();
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          3/3rds Groups
        </h1>
        <Link href="/app/groups/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Create Group
          </Button>
        </Link>
      </div>

      <p className="text-stone-600 dark:text-stone-400 text-sm">
        Form and participate in disciple-making groups. Walk through the 3/3rds
        process together—Look Back, Look Up, Look Forward. Open a group for its
        workspace: next steps, meetings, and (for admins) invites.
      </p>

      {groupsWithMeetings.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center bg-stone-50/50 dark:bg-stone-900/30">
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            You are not in any groups yet.
          </p>
          <Link href="/app/groups/new">
            <Button>
              <Plus className="size-4 mr-2" />
              Create your first group
            </Button>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
