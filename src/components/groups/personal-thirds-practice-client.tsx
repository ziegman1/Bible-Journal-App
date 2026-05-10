"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  finalizeThirdsPersonalWeek,
  recordThirdsPersonalGroupComplete,
} from "@/app/actions/thirds-personal";
import { validatePersonalThirdsFinalizePayload } from "@/lib/groups/thirds-personal-dbs-validate";
import { loadThirdsState, saveThirdsState } from "@/lib/guest/thirds-personal-guest-persistence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { effectiveThirdsPersonalPassageRef } from "@/lib/groups/thirds-personal-helpers";
import type { ThirdsPersonalWorkspacePayload } from "@/lib/groups/thirds-personal-types";
import { formatParticipationWeekLong } from "@/lib/groups/participation-week-display";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { BookOpen, Handshake, MessageCircle, Sparkles } from "lucide-react";

const PRACTICE_ITEMS: { title: string; body: string; icon: typeof Sparkles }[] = [
  {
    title: "Your Testimony",
    body: "Simply share your story of who you were before Christ, how you came to know Christ, and how Jesus has transformed your life.",
    icon: Sparkles,
  },
  {
    title: "The Gospel",
    body: "Share the gospel in a simple, reproducible way.",
    icon: BookOpen,
  },
  {
    title: "This week’s story",
    body: "Practice telling this week’s story as if you were sharing it with someone else.",
    icon: MessageCircle,
  },
  {
    title: "A Spirit-led conversation",
    body: "Role-play or outline how you might enter the conversation the Holy Spirit is nudging you toward with someone this week.",
    icon: Handshake,
  },
];

export function PersonalThirdsPracticeClient({
  initial,
  persistence = "server",
}: {
  initial: ThirdsPersonalWorkspacePayload;
  persistence?: "server" | "guest";
}) {
  const isGuest = persistence === "guest";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const finalized = Boolean(initial.week.finalized_at);
  const passage = effectiveThirdsPersonalPassageRef(initial.week).trim();

  const onFinalize = () => {
    if (isGuest) {
      startTransition(() => {
        const snapshot = loadThirdsState(initial.currentWeekMondayYmd);
        const err = validatePersonalThirdsFinalizePayload(snapshot, snapshot.soloLookUpMode);
        if (err) {
          toast.error(err);
          return;
        }
        const finalizedWeek = {
          ...snapshot.week,
          finalized_at: new Date().toISOString(),
          completed_look_up_mode: snapshot.soloLookUpMode,
        };
        saveThirdsState({ ...snapshot, week: finalizedWeek });
        toast.success("This week is finalized for this browser session only.");
        router.push("/app/groups");
      });
      return;
    }
    startTransition(async () => {
      const r = await finalizeThirdsPersonalWeek();
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Complete 3/3 saved — your week is finalized.");
        router.push("/app/groups");
        router.refresh();
      }
    });
  };

  const onGroupComplete = () => {
    startTransition(async () => {
      const r = await recordThirdsPersonalGroupComplete();
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Complete 3/3 recorded for this pillar week.");
        router.push("/app/groups");
        router.refresh();
      }
    });
  };

  if (finalized) {
    return (
      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Week of {formatParticipationWeekLong(initial.currentWeekMondayYmd)}
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">Practice with someone</h1>
        <p className="text-sm text-muted-foreground">
          This pillar week is already finalized. You can keep practicing anytime; nothing else is required here.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/app/groups/personal-thirds" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View Personal 3/3rds
          </Link>
          <Link href="/app/groups" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            3/3rds Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Week of {formatParticipationWeekLong(initial.currentWeekMondayYmd)}
        </p>
        <h1 className="mt-1 text-2xl font-serif font-light text-foreground">Practice with someone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Before you mark this week complete, set up time with a partner—spouse, friend, disciple, or group member—and
          practice out loud. Choose one or more of the paths below; let the Spirit guide what you need most.
          {isGuest ? " Guest mode does not record streaks or sync to an account." : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This week’s practice paths</CardTitle>
          <CardDescription>
            You are not submitting answers here—this step is a prompt to actually practice with someone in real life.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-4">
            {PRACTICE_ITEMS.map(({ title, body, icon: Icon }) => (
              <li key={title} className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          {passage ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Passage in view: </span>
              {passage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">Ready to count this week?</h2>
        <p className="text-sm text-muted-foreground">
          {isGuest
            ? "Complete 3/3 marks this guest week as finished in this browser session only. Look Back, Look Up, and Look Forward must already be complete."
            : "Complete 3/3 finalizes your solo week and counts toward your 3/3 weekly streak (Look Back, Look Up, and Look Forward must already be complete in the app)."}
        </p>
        <Button type="button" onClick={onFinalize} disabled={pending} className="touch-manipulation">
          Complete 3/3
        </Button>
      </div>

      {!isGuest ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <h3 className="text-sm font-medium text-foreground">Informal group finished?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            If you wrapped up with an off-app 3/3rds group instead of solo practice, you can still record this pillar week
            for your streak here—without re-running the personal workspace.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 touch-manipulation"
            onClick={onGroupComplete}
            disabled={pending}
          >
            Complete 3/3 (informal group)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
