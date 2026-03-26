import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { listGroupMeetings } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupMeetingsPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupResult = await getGroup(groupId);
  if (groupResult.error || !groupResult.group) {
    if (groupResult.error === "Not a member of this group")
      redirect("/app/groups");
    notFound();
  }

  const gPending = (
    groupResult.group as { onboarding_pending?: boolean | null }
  ).onboarding_pending;
  if (gPending === true) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  const meetingsResult = await listGroupMeetings(groupId);
  const meetings = meetingsResult.meetings ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/app/groups/${groupId}`}
            className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
          >
            ← Back to {groupResult.group.name}
          </Link>
          <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mt-2">
            Meetings
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Open a draft, continue an in-progress meeting, or review past ones.
          </p>
        </div>
        <Link href={`/app/groups/${groupId}/meetings/new`}>
          <Button>
            <CalendarPlus className="size-4 mr-2" />
            New meeting
          </Button>
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-card">
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            No meetings yet. Start one from here or from your group workspace.
          </p>
          <Link href={`/app/groups/${groupId}/meetings/new`}>
            <Button>Start first meeting</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => {
            const ps = m.preset_stories;
            const presetObj = Array.isArray(ps) ? ps[0] : ps;
            const passage =
              m.story_source_type === "preset_story" && presetObj
                ? (presetObj as { title: string; book: string; chapter: number; verse_start: number; verse_end: number }).title
                : m.book
                  ? `${m.book} ${m.chapter}:${m.verse_start}-${m.verse_end}`
                  : null;
            return (
              <li key={m.id}>
                <Link
                  href={`/app/groups/${groupId}/meetings/${m.id}`}
                  className="block rounded-xl border border-border p-6 hover:bg-muted/70 dark:hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {m.title ||
                          new Date(m.meeting_date).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                      </p>
                      {passage && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                          {passage}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {(m as { starter_track_week?: number | null }).starter_track_week != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100">
                          Starter W
                          {(m as { starter_track_week: number }).starter_track_week}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          m.status === "completed"
                            ? "bg-stone-100 dark:bg-stone-800"
                            : m.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {m.status === "completed"
                          ? "Completed"
                          : m.status === "active"
                            ? "In progress"
                            : "Draft"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
