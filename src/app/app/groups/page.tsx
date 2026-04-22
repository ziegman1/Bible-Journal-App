import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { GroupCard } from "@/components/groups/group-card";
import { GroupsPageToolbar } from "@/components/groups/groups-page-toolbar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus } from "lucide-react";

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          3/3rds Groups
        </h1>
        <GroupsPageToolbar />
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        Meet with your 3/3rds group using Look Back, Look Up, and Look Forward—or use{" "}
        <span className="font-medium text-stone-800 dark:text-stone-200">Solo 3/3rds</span> on your
        own.
      </p>

      <section
        className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
        aria-labelledby="what-is-thirds-heading"
      >
        <h2
          id="what-is-thirds-heading"
          className="text-sm font-semibold text-foreground"
        >
          What is 3/3rds?
        </h2>
        <div className="mt-2 space-y-2 text-sm leading-snug text-muted-foreground">
          <p>A simple way to meet with others and grow as a disciple.</p>
          <p className="text-foreground/90">Each time together follows three movements:</p>
          <ul className="list-none space-y-1 pl-0">
            <li>
              <span className="font-medium text-foreground">Look Back</span>
              <span className="text-muted-foreground"> — How did you obey and share this week?</span>
            </li>
            <li>
              <span className="font-medium text-foreground">Look Up</span>
              <span className="text-muted-foreground"> — What is God saying in His Word?</span>
            </li>
            <li>
              <span className="font-medium text-foreground">Look Forward</span>
              <span className="text-muted-foreground">
                {" "}
                — What will you do and who will you share with?
              </span>
            </li>
          </ul>
        </div>
        <p className="mt-3 border-t border-border/70 pt-3 text-sm text-muted-foreground">
          Meet with a group—or use{" "}
          <Link
            href="/app/groups/personal-thirds"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Solo 3/3rds
          </Link>{" "}
          to practice on your own.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <a
            href="https://zume.training/3-3-group-meeting-pattern"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-stone-600 underline-offset-2 hover:text-foreground hover:underline dark:text-stone-400 dark:hover:text-stone-200"
          >
            Watch a short walkthrough (Zúme)
            <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
          </a>
        </p>
      </section>

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
          title="If this list is empty on www.badwr.app but shows data on your *.vercel.app preview, the custom domain may point at a different Vercel project or deployment."
        >
          Deploy: {process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID}
        </p>
      ) : null}
    </div>
  );
}
