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
import { GroupWorkspaceManageSection } from "@/components/groups/group-workspace-manage-section";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

type GroupOnboardingFields = {
  onboarding_pending?: boolean | null;
  onboarding_path?: string | null;
  group_kind?: string | null;
};

function starterTrackPrimaryHref(
  groupId: string,
  phase: ReturnType<typeof getStarterTrackProgressLabel>
) {
  switch (phase) {
    case "intro":
      return `/app/groups/${groupId}/starter-track/intro`;
    case "vision":
      return `/app/groups/${groupId}/starter-track/vision`;
    case "not_started":
    case "active":
    case "completed":
    default:
      return `/app/groups/${groupId}/starter-track`;
  }
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
    if (result.error === "Not a member of this group") redirect("/app");
    notFound();
  }

  const { group, role } = result;
  const g = group as typeof group & GroupOnboardingFields;
  const groupKind = g.group_kind ?? "thirds";
  if (groupKind === "chat") {
    redirect(`/app/chat/groups/${groupId}`);
  }

  const isArchived = g.archived_at != null && String(g.archived_at).length > 0;
  const canManageGroup =
    role === "admin" ||
    Boolean(g.admin_user_id && user.id === g.admin_user_id);

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const memberCount = count ?? 0;
  const canStartMeetings = memberCount >= 2;

  /** Onboarding choice only after at least two members (creator + someone else). */
  if (g.onboarding_pending === true && canStartMeetings) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  const onboardingPath = g.onboarding_path ?? null;
  const isExperiencedPath = onboardingPath === "experienced";

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

  const { enrollment: starterEnrollment } = await getStarterTrackEnrollment(groupId);
  const starterPhase = getStarterTrackProgressLabel(starterEnrollment);
  const starterTrackPrimary =
    onboardingPath === "starter_track" &&
    starterPhase !== "completed";

  let starterTrackHint = "Optional 8-week guided path";
  if (isExperiencedPath) {
    starterTrackHint =
      "Choose a preset series or a custom passage for each meeting.";
  } else if (starterEnrollment) {
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
  } else if (starterTrackPrimary && !activeMeeting && !draftMeeting) {
    nextStepTitle = "Starter Track";
    if (starterPhase === "intro")
      nextStepBody = "Read how Look Back, Look Up, and Look Forward work together.";
    else if (starterPhase === "vision")
      nextStepBody = "Agree on a short group vision before Week 1.";
    else if (starterPhase === "active")
      nextStepBody = `Continue Week ${(starterEnrollment?.weeks_completed ?? 0) + 1} of 8 with your group.`;
    else
      nextStepBody = "Open the Starter Track to begin or continue the eight-week path.";
    nextStepHref = starterTrackPrimaryHref(groupId, starterPhase);
    nextStepButtonLabel = "Open Starter Track";
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
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 3/3rds Groups
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Group workspace
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">
          {group.name}
        </h1>
        {group.description && (
          <p className="text-muted-foreground text-sm">
            {group.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border border-border ${
              isAdmin
                ? "bg-muted text-foreground font-medium"
                : "bg-muted/70 text-muted-foreground"
            }`}
          >
            You’re {isAdmin ? "an admin" : "a member"}
          </span>
          <span className="text-sm text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {isArchived && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
          <p className="font-medium">This group is archived</p>
          <p className="text-muted-foreground mt-1">
            It’s hidden from your main Groups list. Members can still open it from
            this link or from{" "}
            <Link
              href="/app/groups/archived"
              className="underline underline-offset-2 font-medium text-foreground"
            >
              Archived groups
            </Link>
            .
          </p>
        </div>
      )}

      {!canStartMeetings && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {isAdmin
            ? "Invite at least one more member to start meetings."
            : "This group needs at least 2 members before meetings can start."}
        </div>
      )}

      {g.onboarding_pending === true && !canStartMeetings && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {isAdmin
            ? "After someone joins, you’ll choose whether anyone is new to 3/3rds or everyone is already experienced — then you can start meetings."
            : "When this group has two members, you’ll be asked how familiar everyone is with the 3/3rds process before meetings start."}
        </div>
      )}

      {/* What to do next */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground">
            {nextStepTitle || "What’s next"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
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
                {canStartMeetings &&
                  !activeMeeting &&
                  !draftMeeting &&
                  !starterTrackPrimary && <CalendarPlus className="size-4 mr-2" />}
                {canStartMeetings &&
                  !activeMeeting &&
                  !draftMeeting &&
                  starterTrackPrimary && <Sparkles className="size-4 mr-2" />}
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
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Go to
        </h2>
        <div className="flex flex-wrap gap-2">
          {canStartMeetings && (
            <Link href={`/app/groups/${groupId}/meetings/new`}>
              <Button
                variant={isExperiencedPath ? "default" : "outline"}
                size="sm"
              >
                <CalendarPlus className="size-4 mr-2" />
                {isExperiencedPath ? "New meeting (story sets)" : "New meeting"}
              </Button>
            </Link>
          )}
          <Link href={`/app/groups/${groupId}/meetings`}>
            <Button variant="outline" size="sm">
              <Calendar className="size-4 mr-2" />
              All meetings
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
        <p className="text-xs text-muted-foreground mt-2">
          {isExperiencedPath ? "Story sets" : "Starter Track"}: {starterTrackHint}
        </p>
      </section>

      {/* Meetings at a glance */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Meetings at a glance
        </h2>

        <div className="grid gap-3 sm:grid-cols-1">
          {activeMeeting && (
            <Card
              size="sm"
              className="border-border bg-card shadow-sm border-l-4 border-l-green-600/70 dark:border-l-green-500/80"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  Active now
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {meetingLabel(activeMeeting)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/app/groups/${groupId}/meetings/${activeMeeting.id}`}
                >
                  <Button variant="default" size="sm" className="w-full sm:w-auto">
                    Continue meeting
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {draftMeeting && (
            <Card size="sm" className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground">
                  Draft
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {meetingLabel(draftMeeting)} ·{" "}
                  {shortMeetingDate(draftMeeting.meeting_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/app/groups/${groupId}/meetings/${draftMeeting.id}`}
                >
                  <Button variant="outline" size="sm">
                    Open draft
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {latestCompleted && (
            <Card size="sm" className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground">Last completed</CardTitle>
                <CardDescription className="text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              No meetings yet. When someone starts one, it will show here.
            </p>
          )}
        </div>
      </section>

      {/* Recent list */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent meetings
          </h2>
          {meetings.length > 0 && (
            <Link
              href={`/app/groups/${groupId}/meetings`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {recentMeetings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No meetings yet. Start one from “What’s next” or “New meeting.”
          </p>
        ) : (
          <ul className="space-y-2">
            {recentMeetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/app/groups/${groupId}/meetings/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors text-sm shadow-sm"
                >
                  <span className="text-foreground">
                    {m.title || shortMeetingDate(m.meeting_date)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 border border-border ${
                      m.status === "completed"
                        ? "bg-muted text-muted-foreground"
                        : m.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-muted text-foreground"
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

      {canManageGroup && (
        <GroupWorkspaceManageSection
          groupId={groupId}
          groupName={group.name}
          variant={isArchived ? "archived" : "active"}
        />
      )}
    </div>
  );
}
