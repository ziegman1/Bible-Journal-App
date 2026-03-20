import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { getStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import {
  getStarterWeekConfig,
  STARTER_TRACK_V1_WEEKS,
} from "@/lib/groups/starter-track/starter-track-v1-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StartStarterWeekMeetingButton } from "@/components/groups/starter-track/starter-track-hub-actions";

interface PageProps {
  params: Promise<{ groupId: string; weekNumber: string }>;
}

export default async function StarterTrackWeekPage({ params }: PageProps) {
  const { groupId, weekNumber: weekStr } = await params;
  const weekNum = parseInt(weekStr, 10);
  if (Number.isNaN(weekNum) || weekNum < 1 || weekNum > 8) {
    notFound();
  }

  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupResult = await getGroup(groupId);
  if (groupResult.error || !groupResult.group) {
    if (groupResult.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const memberCount = count ?? 0;
  const canMeet = memberCount >= 2;

  const { enrollment } = await getStarterTrackEnrollment(groupId);
  if (!enrollment?.vision_completed_at) {
    redirect(`/app/groups/${groupId}/starter-track/vision`);
  }

  const wc = enrollment.weeks_completed;
  const cfg = getStarterWeekConfig(weekNum);
  if (!cfg) notFound();

  const locked = weekNum > wc + 1;
  const isCurrent = weekNum === wc + 1;
  const done = weekNum <= wc;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 pb-16">
      <div>
        <Link
          href={`/app/groups/${groupId}/starter-track`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Starter Track
        </Link>
      </div>

      <header>
        <p className="text-xs font-medium uppercase text-amber-700 dark:text-amber-300">
          Week {weekNum} of {STARTER_TRACK_V1_WEEKS.length}
        </p>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mt-1">
          {cfg.title}
        </h1>
        {done && (
          <p className="text-sm text-green-700 dark:text-green-400 mt-2">
            This week is marked complete for your group. You can still review the guide anytime.
          </p>
        )}
        {locked && (
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
            Finish Week {wc + 1} first (complete that meeting in the app to unlock the next week).
          </p>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Look Up — primary passage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-stone-700 dark:text-stone-300 space-y-2">
          <p className="font-medium">
            {cfg.primaryPassage.book} {cfg.primaryPassage.chapter}:
            {cfg.primaryPassage.verseStart}–{cfg.primaryPassage.verseEnd}
          </p>
          {cfg.additionalLookUpRefs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mt-2">
                Also read or reference
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {cfg.additionalLookUpRefs.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {cfg.reminders.length > 0 && (
        <Card className="border-amber-200/60 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle className="text-base">Never skip</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-stone-700 dark:text-stone-300 space-y-1">
              {cfg.reminders.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice & homework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          {cfg.practiceSections.map((s, i) => (
            <section key={i}>
              {s.heading ? (
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">
                  {s.heading}
                </h3>
              ) : null}
              <p className="whitespace-pre-wrap">{s.body}</p>
            </section>
          ))}
        </CardContent>
      </Card>

      {cfg.assetPaths?.metricsDiagram && cfg.assetPaths.churchCircleDiagram && (
        <div className="space-y-6">
          <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Week 8 diagrams (reference)
          </h2>
          <figure className="space-y-2">
            <figcaption className="text-xs text-stone-500">
              Attendance / believing / baptized counts
            </figcaption>
            <div className="relative w-full max-w-md rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden bg-white">
              <Image
                src={cfg.assetPaths.metricsDiagram}
                alt="Template: stick figure, cross, and water symbols with three blanks for numbers"
                width={640}
                height={360}
                className="w-full h-auto"
              />
            </div>
          </figure>
          <figure className="space-y-2">
            <figcaption className="text-xs text-stone-500">
              Church circle — place symbols inside or outside
            </figcaption>
            <div className="relative w-full max-w-lg rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden bg-white">
              <Image
                src={cfg.assetPaths.churchCircleDiagram}
                alt="Circle diagram with symbols for fellowship, giving, communion, baptism, prayer, leaders, Bible, praise, and evangelism"
                width={640}
                height={640}
                className="w-full h-auto"
              />
            </div>
          </figure>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
        {!locked && canMeet && isCurrent && (
          <StartStarterWeekMeetingButton groupId={groupId} week={weekNum} />
        )}
        {!canMeet && isCurrent && !locked && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Invite another member before starting this meeting.
          </p>
        )}
        <Link href={`/app/groups/${groupId}/starter-track`}>
          <Button variant="outline">Back to track</Button>
        </Link>
      </div>
    </div>
  );
}
