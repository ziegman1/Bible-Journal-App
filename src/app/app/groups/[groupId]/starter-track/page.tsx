import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";
import { getStarterTrackEnrollment } from "@/app/actions/group-starter-track";
import { getStarterTrackProgressLabel } from "@/lib/groups/starter-track/progress";
import { STARTER_TRACK_V1_WEEKS } from "@/lib/groups/starter-track/starter-track-v1-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnrollStarterTrackButton } from "@/components/groups/starter-track/starter-track-hub-actions";
import { CheckCircle, Circle, Lock, Sparkles } from "lucide-react";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function StarterTrackHubPage({ params }: PageProps) {
  const { groupId } = await params;
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

  const { enrollment, error: enError } = await getStarterTrackEnrollment(groupId);
  if (enError && enError !== "Not a member of this group") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-amber-600">{enError}</p>
      </div>
    );
  }

  const phase = getStarterTrackProgressLabel(enrollment);
  const wc = enrollment?.weeks_completed ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href={`/app/groups/${groupId}`}
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to {groupResult.group.name}
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Sparkles className="size-3.5" />
          Starter Track
        </p>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          How a 3/3rds group works
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
          An eight-week path for groups new to the process: same meeting flow you already use,
          with assigned passages, practice, and clear next steps.
        </p>
      </header>

      {!enrollment && (
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Enabling the Starter Track for this group adds a shared checklist, vision step, and
              week-by-week guides. It does not replace normal meetings—you still use the same
              meeting room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollStarterTrackButton groupId={groupId} />
          </CardContent>
        </Card>
      )}

      {enrollment && phase === "intro" && (
        <Card className="border-amber-200 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle>Step 1: Basic instructions</CardTitle>
            <CardDescription>
              Read how Look Back, Look Up, and Look Forward work together.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/app/groups/${groupId}/starter-track/intro`}>
              <Button size="lg">Open introduction</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {enrollment && phase === "vision" && (
        <Card className="border-amber-200 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle>Step 2: Group vision</CardTitle>
            <CardDescription>
              Agree on a short vision statement before Week 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/app/groups/${groupId}/starter-track/vision`}>
              <Button size="lg">Set group vision</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {enrollment && (phase === "active" || phase === "completed") && (
        <>
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium text-stone-800 dark:text-stone-200">Progress</p>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              {phase === "completed"
                ? "All eight weeks are complete. Keep meeting and use other story series anytime."
                : `Weeks finished: ${wc} of 8. Current focus: Week ${wc + 1}.`}
            </p>
            {enrollment.vision_statement && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Group vision
                </p>
                <p className="text-stone-700 dark:text-stone-300 mt-1 whitespace-pre-wrap">
                  {enrollment.vision_statement}
                </p>
                <Link
                  href={`/app/groups/${groupId}/starter-track/vision`}
                  className="text-sm text-amber-800 dark:text-amber-200 underline mt-2 inline-block"
                >
                  Edit vision statement
                </Link>
              </div>
            )}
          </div>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-3">
              Eight weeks
            </h2>
            <ul className="space-y-2">
              {STARTER_TRACK_V1_WEEKS.map((w) => {
                const done = w.week <= wc;
                const current = w.week === wc + 1 && phase === "active";
                const locked = w.week > wc + 1;

                const rowClass = `flex items-start gap-3 rounded-xl border p-4 ${
                  locked
                    ? "border-border/50 opacity-60"
                    : "border-border hover:bg-muted/70 dark:hover:bg-muted/30 transition-colors"
                } ${current ? "ring-1 ring-amber-400/60 dark:ring-amber-600/40" : ""}`;

                return (
                  <li key={w.week}>
                    {locked ? (
                      <div className={rowClass}>
                        <span className="shrink-0 mt-0.5">
                          <Lock className="size-5 text-stone-400" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-800 dark:text-stone-200">
                            {w.title}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            Complete prior weeks to unlock
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/app/groups/${groupId}/starter-track/week/${w.week}`}
                        className={rowClass}
                      >
                        <span className="shrink-0 mt-0.5">
                          {done ? (
                            <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="size-5 text-amber-600 dark:text-amber-400" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-800 dark:text-stone-200">
                            {w.title}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {w.primaryPassage.book} {w.primaryPassage.chapter}:
                            {w.primaryPassage.verseStart}–{w.primaryPassage.verseEnd}
                            {done ? " · Completed" : current ? " · Up next" : ""}
                          </p>
                        </div>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {phase === "completed" && (
        <Card className="border-green-200/80 dark:border-green-900/40 bg-green-50/30 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle>Where next?</CardTitle>
            <CardDescription>
              You have finished the Starter Track. Keep the same rhythm: create meetings from your
              group workspace, choose any preset story series (Foundations, Gospel, Mission, and
              more) in <strong>New meeting</strong>, and keep obeying, training, and sharing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href={`/app/groups/${groupId}`}>
              <Button variant="default">Group workspace</Button>
            </Link>
            <Link href={`/app/groups/${groupId}/meetings/new`}>
              <Button variant="outline">New meeting (preset stories)</Button>
            </Link>
            <Link href={`/app/groups/${groupId}/meetings`}>
              <Button variant="outline">All meetings</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {enrollment && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Re-read the full format anytime from{" "}
          <Link href={`/app/groups/${groupId}/starter-track/intro`} className="underline">
            Basic instructions
          </Link>
          .
        </p>
      )}
    </div>
  );
}
