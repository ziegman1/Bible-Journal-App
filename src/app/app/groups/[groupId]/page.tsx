import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { Users, CalendarPlus, UserCog, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupOverviewPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getGroup(groupId);
  if (result.error || !result.group) {
    if (result.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }

  const { group, role } = result;
  const meetingsResult = await listGroupMeetings(groupId);
  const meetings = meetingsResult.meetings ?? [];
  const recentMeetings = meetings.slice(0, 5);
  const nextMeeting = meetings.find((m) => m.status === "draft" || m.status === "active");

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/app/groups"
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to groups
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          {group.name}
        </h1>
        {group.description && (
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {group.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              role === "admin"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
            }`}
          >
            {role}
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {count ?? 0} member{(count ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {(count ?? 0) < 2 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {role === "admin"
            ? "Invite at least one more member to start meetings."
            : "This group needs at least 2 members before meetings can start."}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {(count ?? 0) >= 2 ? (
          <Link href={`/app/groups/${groupId}/meetings/new`}>
            <Button>
              <CalendarPlus className="size-4 mr-2" />
              Start new meeting
            </Button>
          </Link>
        ) : role === "admin" ? (
          <Link href={`/app/groups/${groupId}/members`}>
            <Button>
              <Users className="size-4 mr-2" />
              Invite members
            </Button>
          </Link>
        ) : null}
        {role === "admin" && (
          <Link href={`/app/groups/${groupId}/members`}>
            <Button variant="outline">
              <UserCog className="size-4 mr-2" />
              Manage members
            </Button>
          </Link>
        )}
        <Link href={`/app/groups/${groupId}/meetings`}>
          <Button variant="outline">
            <Calendar className="size-4 mr-2" />
            Meeting history
          </Button>
        </Link>
      </div>

      {nextMeeting && (
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-amber-50/30 dark:bg-amber-900/10">
          <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
            Next meeting
          </h2>
          <p className="text-stone-800 dark:text-stone-200 font-medium">
            {nextMeeting.title || new Date(nextMeeting.meeting_date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Status: {nextMeeting.status}
          </p>
          <Link href={`/app/groups/${groupId}/meetings/${nextMeeting.id}`} className="mt-4 inline-block">
            <Button>Open meeting</Button>
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
          Recent meetings
        </h2>
        {recentMeetings.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            No meetings yet. Start one to begin the 3/3rds process.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentMeetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/app/groups/${groupId}/meetings/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 p-4 hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
                >
                  <span className="text-stone-800 dark:text-stone-200">
                    {m.title ||
                      new Date(m.meeting_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === "completed"
                        ? "bg-stone-100 dark:bg-stone-800"
                        : m.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {m.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
