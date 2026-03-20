import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { getStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { getStarterTrackProgressLabel } from "@/lib/groups/starter-track/progress";
import { listGroupMeetings } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  FileText,
  PlayCircle,
  UserCog,
  Users,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

function meetingLabel(m: {
  title?: string | null;
  meeting_date: string;
}) {
  return (
    m.title ||
    new Date(m.meeting_date).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  );
}

function shortMeetingDate(meeting_date: string) {
  return new Date(meeting_date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const isAdmin = role === "admin";
  const meetingsResult = await listGroupMeetings(groupId);
  const meetings = meetingsResult.meetings ?? [];

  const activeMeeting = meetings.find((m) => m.status === "active");
  const draftMeeting = meetings.find((m) => m.status === "draft");
  const latestCompleted = meetings.find((m) => m.status === "completed");

  let hasSummaryForLatestCompleted = false;
  if (latestCompleted) {
    const { data: summaryRow } = await supabase
      .from("meeting_summaries")
      .select("meeting_id")
      .eq("meeting_id", latestCompleted.id)
      .maybeSingle();
    hasSummaryForLatestCompleted = !!summaryRow;
  }

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const memberCount = count ?? 0;
  const canStartMeetings = memberCount >= 2;

  const { enrollment: starterEnrollment } = await getStarterTrackEnrollment(groupId);
  const starterPhase = getStarterTrackProgressLabel(starterEnrollment);
  let starterTrackHint = "Optional 8-week guided path";
  if (starterEnrollment) {
    if (starterPhase === "intro") starterTrackHint = "Next: read introduction";
    else if (starterPhase === "vision") starterTrackHint = "Next: group vision";
    else if (starterPhase === "active")
      starterTrackHint = `Week ${(starterEnrollment.weeks_completed ?? 0) + 1} of 8`;
    else if (starterPhase === "completed") starterTrackHint = "Track complete — keep meeting!";
  }

  const recentMeetings = meetings.slice(0, 5);

  /** Primary CTA for “what to do next” */
  let nextStepTitle = "";
  let nextStepBody = "";
  let nextStepHref: string | null = null;
  let nextStepButtonLabel = "";

  if (!canStartMeetings) {
    nextStepTitle = "Add another member";
    nextStepBody = isAdmin
      ? "Invite someone so this group can run 3/3rds meetings."
      : "This group needs at least two members before meetings can start.";
    nextStepHref = isAdmin ? `/app/groups/${groupId}/members` : null;
    nextStepButtonLabel = isAdmin ? "Invite & manage members" : "";
  } else if (activeMeeting) {
    nextStepTitle = "Meeting in progress";
    nextStepBody = `Continue where you left off: ${meetingLabel(activeMeeting)}`;
    nextStepHref = `/app/groups/${groupId}/meetings/${activeMeeting.id}`;
    nextStepButtonLabel = "Continue meeting";
  } else if (draftMeeting) {
    nextStepTitle = "Draft meeting ready";
    nextStepBody = `Pick up your draft: ${meetingLabel(draftMeeting)}`;
    nextStepHref = `/app/groups/${groupId}/meetings/${draftMeeting.id}`;
    nextStepButtonLabel = "Continue draft";
  } else {
    nextStepTitle = "Start a meeting";
    nextStepBody =
      "Begin a new 3/3rds session when your group is ready to meet.";
    nextStepHref = `/app/groups/${groupId}/meetings/new`;
    nextStepButtonLabel = "Start new meeting";
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/app/groups"
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← All groups
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Group workspace
        </p>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          {group.name}
        </h1>
        {group.description && (
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            {group.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isAdmin
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
            }`}
          >
            You’re {isAdmin ? "an admin" : "a member"}
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {!canStartMeetings && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {isAdmin
            ? "Invite at least one more member to start meetings."
            : "This group needs at least 2 members before meetings can start."}
        </div>
      )}

      {/* What to do next */}
      <Card className="border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
        <CardHeader className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
          <CardTitle className="text-stone-900 dark:text-stone-100">
            {nextStepTitle || "What’s next"}
          </CardTitle>
          <CardDescription className="text-stone-600 dark:text-stone-400">
            {nextStepBody}
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t-0 bg-transparent pt-0 pb-4 flex flex-wrap gap-2">
          {nextStepHref && nextStepButtonLabel && (
            <Link href={nextStepHref}>
              <Button size="lg">
                {activeMeeting && <PlayCircle className="size-4 mr-2" />}
                {draftMeeting && !activeMeeting && (
                  <Calendar className="size-4 mr-2" />
                )}
                {canStartMeetings && !activeMeeting && !draftMeeting && (
                  <CalendarPlus className="size-4 mr-2" />
                )}
                {!canStartMeetings && isAdmin && (
                  <Users className="size-4 mr-2" />
                )}
                {nextStepButtonLabel}
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Quick links — existing routes only */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-3">
          Go to
        </h2>
        <div className="flex flex-wrap gap-2">
          {canStartMeetings && (
            <Link href={`/app/groups/${groupId}/meetings/new`}>
              <Button variant="outline" size="sm">
                <CalendarPlus className="size-4 mr-2" />
                New meeting
              </Button>
            </Link>
          )}
          <Link href={`/app/groups/${groupId}/meetings`}>
            <Button variant="outline" size="sm">
              <Calendar className="size-4 mr-2" />
              All meetings
            </Button>
          </Link>
          <Link href={`/app/groups/${groupId}/starter-track`}>
            <Button variant="outline" size="sm" className="border-amber-200 dark:border-amber-800/60">
              <Sparkles className="size-4 mr-2 text-amber-700 dark:text-amber-300" />
              Starter Track
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/app/groups/${groupId}/members`}>
              <Button variant="outline" size="sm">
                <UserCog className="size-4 mr-2" />
                Members & invites
              </Button>
            </Link>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          Starter Track: {starterTrackHint}
        </p>
      </section>

      {/* Meetings at a glance */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Meetings at a glance
        </h2>

        <div className="grid gap-3 sm:grid-cols-1">
          {activeMeeting && (
            <Card size="sm" className="border-green-200/80 dark:border-green-900/40 bg-green-50/40 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  Active now
                </CardTitle>
                <CardDescription className="text-green-800/90 dark:text-green-200/80">
                  {meetingLabel(activeMeeting)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/app/groups/${groupId}/meetings/${activeMeeting.id}`}
                >
                  <Button size="sm" className="w-full sm:w-auto">
                    Continue meeting
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {draftMeeting && (
            <Card size="sm" className="border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-900 dark:text-amber-100">
                  Draft
                </CardTitle>
                <CardDescription>
                  {meetingLabel(draftMeeting)} ·{" "}
                  {shortMeetingDate(draftMeeting.meeting_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/app/groups/${groupId}/meetings/${draftMeeting.id}`}
                >
                  <Button variant="secondary" size="sm">
                    Open draft
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {latestCompleted && (
            <Card size="sm" className="border-stone-200 dark:border-stone-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Last completed</CardTitle>
                <CardDescription>
                  {meetingLabel(latestCompleted)} ·{" "}
                  {shortMeetingDate(latestCompleted.meeting_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                <Link
                  href={`/app/groups/${groupId}/meetings/${latestCompleted.id}`}
                >
                  <Button variant="outline" size="sm">
                    Open meeting
                  </Button>
                </Link>
                {hasSummaryForLatestCompleted && (
                  <Link
                    href={`/app/groups/${groupId}/meetings/${latestCompleted.id}/summary`}
                  >
                    <Button variant="outline" size="sm">
                      <FileText className="size-4 mr-1.5" />
                      Summary
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {!activeMeeting && !draftMeeting && !latestCompleted && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No meetings yet. When someone starts one, it will show here.
            </p>
          )}
        </div>
      </section>

      {/* Recent list */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Recent meetings
          </h2>
          {meetings.length > 0 && (
            <Link
              href={`/app/groups/${groupId}/meetings`}
              className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {recentMeetings.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            No meetings yet. Start one from “What’s next” or “New meeting.”
          </p>
        ) : (
          <ul className="space-y-2">
            {recentMeetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/app/groups/${groupId}/meetings/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 p-3 hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors text-sm"
                >
                  <span className="text-stone-800 dark:text-stone-200">
                    {m.title || shortMeetingDate(m.meeting_date)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      m.status === "completed"
                        ? "bg-stone-100 dark:bg-stone-800"
                        : m.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {m.status === "draft"
                      ? "draft"
                      : m.status === "active"
                        ? "active"
                        : "done"}
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
