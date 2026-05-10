"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { completeLinearLessonStep } from "@/app/actions/linear-journey";
import type { LessonDoc } from "@/content/guided-journey/lesson-docs";
import { ShareViaEmailTextButtons } from "@/components/entry-share";
import { LessonRichParagraph } from "@/components/journey/lesson-rich-text";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LinearDiscipleshipStepKey } from "@/lib/app-experience-mode/linear-discipleship-path";
import { cn } from "@/lib/utils";

const MIN_LEN = 40;

export function GuidedLessonStep({
  stepKey,
  lesson,
  initialReflection,
  sentInviteCount = 0,
  minSentInvitesRequired,
}: {
  stepKey: LinearDiscipleshipStepKey;
  lesson: LessonDoc;
  initialReflection?: string;
  /** Invites where the user opened Text or Email from the journey invite page. */
  sentInviteCount?: number;
  /** When set (e.g. 3 for Dual Accountability), lesson cannot be completed until this many sent invites exist. */
  minSentInvitesRequired?: number;
}) {
  const router = useRouter();
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [shareTapped, setShareTapped] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareBody = useMemo(() => {
    const currentLesson = lesson.principlePromptName;
    const userReflection = reflection.trim();
    return [
      "Hey! I've been going through a discipleship journey lately, and I'm learning some things that are really shifting how I think—in a really good way.",
      "",
      `I just worked through something on ${currentLesson}, and I wanted to share it with you.`,
      "",
      userReflection,
      "",
      "Would love to hear what you think.",
    ].join("\n");
  }, [lesson.principlePromptName, reflection]);

  const invitesOk = !minSentInvitesRequired || sentInviteCount >= minSentInvitesRequired;
  const canComplete = reflection.trim().length >= MIN_LEN && shareTapped && invitesOk;
  const inviteShortfall =
    minSentInvitesRequired && sentInviteCount < minSentInvitesRequired
      ? minSentInvitesRequired - sentInviteCount
      : 0;

  async function onComplete() {
    setError(null);
    setPending(true);
    const res = await completeLinearLessonStep({
      stepKey,
      reflection,
      shareConfirmed: shareTapped,
    });
    setPending(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.replace(`/app/journey?from=${encodeURIComponent(stepKey)}`);
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/guided-lesson-step.tsx — #1");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-950/40 sm:p-8">
        {lesson.introduction?.trim() ? (
          <p className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 border-b border-stone-200/70 pb-6 dark:border-stone-800">
            {lesson.introduction}
          </p>
        ) : null}
        <div className={cn("space-y-10", lesson.introduction?.trim() ? "pt-6" : "")}>
          {lesson.sections.map((s) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="font-serif text-lg font-normal tracking-tight text-stone-900 dark:text-stone-100">
                {s.heading}
              </h2>
              {s.paragraphs.map((p, i) => (
                <LessonRichParagraph
                  key={`${s.heading}-${i}`}
                  text={p}
                  className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700 dark:text-stone-300"
                />
              ))}
            </section>
          ))}
        </div>
        <aside className="mt-10 rounded-xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
          <h3 className="font-serif text-base font-normal text-amber-950 dark:text-amber-100">
            {lesson.summary.heading}
          </h3>
          <div className="mt-3 space-y-2">
            {lesson.summary.paragraphs.map((p, i) => (
              <LessonRichParagraph
                key={`summary-${i}`}
                text={p}
                className="whitespace-pre-line text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/85"
              />
            ))}
          </div>
        </aside>
      </div>

      {minSentInvitesRequired ? (
        <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/60 via-white to-stone-50/80 p-5 shadow-sm dark:border-violet-900/30 dark:from-violet-950/20 dark:via-stone-950 dark:to-stone-950/80 sm:p-8">
          <h2 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
            Bring a few people with you
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This lesson is about receiving from God and letting it move through you into others. When
            you're ready, open your invite page and actually send a text or email for each person—that
            is what we count as an invite, because it mirrors real obedience.
          </p>
          <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">
            {inviteShortfall > 0
              ? `${sentInviteCount} of ${minSentInvitesRequired} real invites so far—${inviteShortfall} more to go.`
              : `${sentInviteCount} of ${minSentInvitesRequired} invites sent. You're clear to finish below.`}
          </p>
          <Link
            href="/app/journey/invite"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-5 inline-flex min-h-10")}
          >
            Open invite page
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Start with one person now. You will add more later.
          </p>
        </section>
      ) : null}

      <section
        className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 dark:border-stone-800 dark:bg-stone-900/30 sm:p-8"
        aria-labelledby="guided-response-heading"
      >
        <h2
          id="guided-response-heading"
          className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100"
        >
          Your response before God
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Do you understand the biblical principle of <strong>{lesson.principlePromptName}</strong>? Explain
          what the principle is and why it matters for becoming a <strong>reproducing disciple</strong>.
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="guided-lesson-reflection" className="text-stone-800 dark:text-stone-200">
            Reflection
          </Label>
          <Textarea
            id="guided-lesson-reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={7}
            className="min-h-[160px] border-stone-200 bg-white text-base dark:border-stone-700 dark:bg-stone-950 sm:text-sm"
            placeholder="Write at least a few sentences…"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            {reflection.trim().length}/{MIN_LEN} characters minimum
          </p>
        </div>

        <div className="mt-8 border-t border-stone-200/80 pt-8 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Share</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Share your reflection with someone who will pray for you and encourage obedience—the same
            pattern you will use in SOAPS.
          </p>
          <div className="mt-4">
            <ShareViaEmailTextButtons
              subject={`Something I'm learning — ${lesson.principlePromptName}`}
              body={shareBody}
              appendProductFooter={false}
              onShareChannelIntent={() => setShareTapped(true)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {canComplete
              ? "When you are ready, mark this lesson complete to unlock your next step."
              : !invitesOk
                ? "Send the remaining invites from your invite page, then finish your reflection and share."
                : "Complete your reflection and use Share via Text or Email to continue."}
          </p>
          <Button
            type="button"
            disabled={!canComplete || pending}
            className={cn("min-h-11 w-full shrink-0 sm:w-auto")}
            onClick={onComplete}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </span>
            ) : (
              "Mark lesson complete"
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
