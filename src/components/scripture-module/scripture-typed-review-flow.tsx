"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  getPostReviewSessionNavigation,
  submitReviewExerciseRound,
  type ReviewProgressionKind,
} from "@/app/actions/scripture-module";
import { INITIAL_REVIEW_STAGE } from "@/lib/scripture-module/review-stage-progression";
import {
  buildPhraseWordSlots,
  buildRecallWordSlots,
} from "@/lib/scripture-module/memorize-support-pattern";
import { referenceToTypingToken } from "@/lib/scripture-module/reference-typing-token";
import { MEMORIZE_PASS_ACCURACY } from "@/lib/scripture-module/memorize-scoring-engine";
import { practiceStageTitle } from "@/lib/scripture-module/stage-labels";
import {
  buildStage2MicroSteps,
  describeStage2MicroStep,
  segmentsForStage2MicroStep,
  stage2MicroStepCount,
  stage2RepsPerMicroStep,
} from "@/lib/scripture-module/stage2-cumulative";
import { wordsFromPhraseSegments } from "@/lib/scripture-module/memorize-words";
import { stage3HiddenWordIndices, stage4HiddenWordIndices } from "@/lib/scripture-module/stage-masking";
import {
  MemorizeSequentialRecall,
  type RecallLayoutMode,
} from "@/components/scripture-module/memorize-sequential-recall";
import {
  SCRIPTURE_READING_TEXT,
  SCRIPTURE_TRAINING_META,
  SCRIPTURE_TRAINING_STEP,
  ScriptureTrainingShell,
} from "@/components/scripture-module/scripture-training-shell";
import { cn } from "@/lib/utils";
import type { GripMemoryDTO, ReviewStage, ScriptureItemDTO } from "@/lib/scripture-module/types";
import { buttonVariants } from "@/components/ui/button-variants";

function reviewStageTitle(rs: ReviewStage): string {
  return practiceStageTitle(rs);
}

/** Review ladder position 2–5 (matches memorization stage names). */
function reviewStepNumber(rs: ReviewStage): number {
  switch (rs) {
    case "stage_2":
      return 2;
    case "stage_3":
      return 3;
    case "stage_4":
      return 4;
    case "stage_5":
      return 5;
    default:
      return 4;
  }
}

function formatReviewStageLabel(rs: ReviewStage): string {
  const n = rs.replace("stage_", "");
  return `Stage ${n}`;
}

function progressionMessage(p: ReviewProgressionKind, nextStage: ReviewStage): string {
  const label = formatReviewStageLabel(nextStage);
  switch (p) {
    case "session_complete":
      return "Review cycle complete. Your next review is scheduled.";
    case "advanced":
      return `Moving forward — next: ${label}.`;
    case "dropped":
      return `Let’s rebuild confidence — next: ${label}.`;
    case "retry_same":
      return "Same step — try this unit again when you’re ready.";
    default:
      return "";
  }
}

export function ScriptureTypedReviewFlow({
  item,
  phraseSegments,
  initialMemory,
}: {
  item: ScriptureItemDTO;
  phraseSegments: string[];
  initialMemory: GripMemoryDTO;
}) {
  const router = useRouter();
  const [memory, setMemory] = useState(initialMemory);
  const [attemptKey, setAttemptKey] = useState(0);
  const [feedback, setFeedback] = useState<{
    kind: "pass" | "fail";
    accuracy: number;
    detail: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [postReviewPhase, setPostReviewPhase] = useState<
    null | "resolving" | "next" | "caughtUp"
  >(null);
  const navTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current != null) {
        window.clearTimeout(navTimerRef.current);
        navTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setMemory(initialMemory);
  }, [
    initialMemory.id,
    initialMemory.lastStepAt,
    initialMemory.reviewStage,
    initialMemory.reviewProgress,
    initialMemory.reviewIntervalIndex,
    initialMemory.holdNextReviewAt,
  ]);

  const segments = phraseSegments;

  const reviewStage: ReviewStage = memory.reviewStage ?? INITIAL_REVIEW_STAGE;
  const reviewProgress = memory.reviewProgress;

  const practiceSegments = useMemo(() => {
    if (reviewStage === "stage_2") {
      const steps = buildStage2MicroSteps(segments.length);
      const s2 = reviewProgress.stage2 ?? { stepIndex: 0, repIndex: 0 };
      const step = steps[Math.min(s2.stepIndex, Math.max(0, steps.length - 1))];
      return step ? segmentsForStage2MicroStep(segments, step) : [];
    }
    if (reviewStage === "stage_3") {
      const s3 = reviewProgress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
      const pi = Math.min(Math.max(0, s3.phraseIndex), Math.max(0, segments.length - 1));
      const seg = segments[pi];
      return seg != null && String(seg).trim() ? [seg] : [];
    }
    if (reviewStage === "stage_4" || reviewStage === "stage_5") {
      return segments;
    }
    return [];
  }, [reviewStage, reviewProgress, segments]);

  const referenceTypingToken = useMemo(
    () => referenceToTypingToken(item.reference ?? ""),
    [item.reference]
  );

  const wordSlots = useMemo(() => {
    const includeRef =
      (reviewStage === "stage_4" || reviewStage === "stage_5") && referenceTypingToken.length > 0;
    if (includeRef) {
      return buildRecallWordSlots(practiceSegments, referenceTypingToken, true);
    }
    return buildPhraseWordSlots(practiceSegments);
  }, [practiceSegments, reviewStage, referenceTypingToken]);

  const slotsByPhrase = useMemo(() => {
    const m = new Map<number, (typeof wordSlots)[number][]>();
    for (const s of wordSlots) {
      const arr = m.get(s.phraseIndex) ?? [];
      arr.push(s);
      m.set(s.phraseIndex, arr);
    }
    return m;
  }, [wordSlots]);

  const supportVisible = useMemo(() => {
    const n = wordSlots.length;
    if (n === 0) return [];
    if (reviewStage === "stage_2") {
      return Array(n).fill(true);
    }
    if (reviewStage === "stage_3") {
      const s3 = reviewProgress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
      const phraseWords = wordSlots.filter((w) => w.phraseIndex === 0).length;
      const hidden = stage3HiddenWordIndices(s3.roundIndex, phraseWords);
      return wordSlots.map((_, i) => Boolean(!hidden.has(i)));
    }
    if (reviewStage === "stage_4") {
      const hidden = stage4HiddenWordIndices(n);
      return wordSlots.map((_, i) => Boolean(!hidden.has(i)));
    }
    if (reviewStage === "stage_5") {
      return Array(n).fill(false);
    }
    return Array(n).fill(true);
  }, [reviewStage, reviewProgress, wordSlots]);

  const stage2Lines = useMemo(() => {
    if (reviewStage !== "stage_2" || segments.length === 0) return null;
    const steps = buildStage2MicroSteps(segments.length);
    const s2 = reviewProgress.stage2 ?? { stepIndex: 0, repIndex: 0 };
    const step = steps[Math.min(s2.stepIndex, Math.max(0, steps.length - 1))];
    const totalSteps = stage2MicroStepCount(segments.length);
    const totalWords = wordsFromPhraseSegments(segments).length;
    const repTotal = stage2RepsPerMicroStep(segments.length, totalWords);
    return {
      stepLabel: step ? describeStage2MicroStep(step) : "",
      rep: s2.repIndex + 1,
      stepIndex: s2.stepIndex + 1,
      totalSteps,
      repTotal,
    };
  }, [reviewStage, reviewProgress, segments]);

  const stage3Lines = useMemo(() => {
    if (reviewStage !== "stage_3") return null;
    const s3 = reviewProgress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
    return {
      phrase: s3.phraseIndex + 1,
      phraseTotal: Math.max(1, segments.length),
      round: s3.roundIndex + 1,
      roundTotal: 2,
    };
  }, [reviewStage, reviewProgress, segments.length]);

  const recallRoundKey = useMemo(
    () => `${attemptKey}-${reviewStage}-${JSON.stringify(memory.reviewProgress)}`,
    [attemptKey, reviewStage, memory.reviewProgress]
  );

  const recallLayoutMode: RecallLayoutMode = useMemo(
    () => (reviewStage === "stage_4" || reviewStage === "stage_5" ? "passage" : "phrases"),
    [reviewStage]
  );

  const refreshFromServer = useCallback(() => {
    router.refresh();
  }, [router]);

  const clearTypingFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const onSubmitRound = useCallback(
    (slots: string[], wrongAttemptsParam: number) => {
      setError(null);
      setFeedback(null);
      startTransition(async () => {
        const res = await submitReviewExerciseRound(item.id, slots, wrongAttemptsParam);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const pct = Math.round(res.accuracy * 100);
      const minPct = Math.round(MEMORIZE_PASS_ACCURACY * 100);
      const detail = progressionMessage(res.progression, res.nextReviewStage);

      if (res.reviewSessionComplete) {
        setFeedback(null);
        setMemory((m) => ({
          ...m,
          reviewStage: res.nextReviewStage,
          holdNextReviewAt: res.nextHoldReviewAt ?? m.holdNextReviewAt,
          holdLastReviewedAt: new Date().toISOString(),
        }));
        setPostReviewPhase("resolving");
        startTransition(async () => {
          const nav = await getPostReviewSessionNavigation(item.id);
          if ("error" in nav) {
            setError(nav.error);
            setPostReviewPhase(null);
            return;
          }
          if (navTimerRef.current != null) {
            window.clearTimeout(navTimerRef.current);
          }
          if (nav.nextReviewHref) {
            setPostReviewPhase("next");
            navTimerRef.current = window.setTimeout(() => {
              navTimerRef.current = null;
              router.replace(nav.nextReviewHref!);
            }, 1200);
          } else {
            setPostReviewPhase("caughtUp");
            navTimerRef.current = window.setTimeout(() => {
              navTimerRef.current = null;
              router.replace("/scripture/review");
            }, 3000);
          }
        });
        return;
      }

      if (!res.passed) {
        setFeedback({
          kind: "fail",
          accuracy: res.accuracy,
          detail:
            pct < minPct
              ? `About ${pct}% — aim for at least ${minPct}% on longer stretches (very short lines allow one miss). ${detail}`
              : `About ${pct}%. ${detail}`,
        });
        setAttemptKey((k) => k + 1);
        setMemory((m) => ({
          ...m,
          reviewStage: res.nextReviewStage,
        }));
        refreshFromServer();
        return;
      }

      setFeedback({
        kind: "pass",
        accuracy: res.accuracy,
        detail: `About ${pct}%. ${detail}`,
      });
      setAttemptKey((k) => k + 1);
      setMemory((m) => ({
        ...m,
        reviewStage: res.nextReviewStage,
      }));
      refreshFromServer();
    });
    },
    [item.id, refreshFromServer, router]
  );

  return (
    <div className="relative space-y-8">
      {postReviewPhase ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background/96 px-6 text-center backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          {postReviewPhase === "resolving" ? (
            <p className="text-sm text-muted-foreground">Saving your review…</p>
          ) : postReviewPhase === "next" ? (
            <>
              <p className="max-w-md text-lg font-medium text-foreground sm:text-xl">
                Nice work — continuing to your next review.
              </p>
              <p className="text-sm text-muted-foreground">Loading the next passage…</p>
            </>
          ) : (
            <>
              <p className="max-w-md text-lg font-medium text-foreground sm:text-xl">
                Congratulations, you are all caught up!
              </p>
              <p className="text-sm text-muted-foreground">Returning to your review queue…</p>
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Retention review
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">{item.reference}</h1>
          {item.translation ? (
            <p className="text-sm text-muted-foreground">{item.translation}</p>
          ) : null}
        </div>
        <Link
          href={`/scripture/items/${item.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Back to verse
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <div
          role="status"
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm",
            feedback.kind === "pass"
              ? "bg-emerald-500/10 text-emerald-100/95"
              : "bg-amber-500/10 text-amber-100/95"
          )}
        >
          <p className="font-medium">
            {feedback.kind === "pass" ? "Passed" : "Not quite"} · {Math.round(feedback.accuracy * 100)}%
          </p>
          <p className="mt-1 opacity-90">{feedback.detail}</p>
        </div>
      ) : null}

      <section>
        <ScriptureTrainingShell>
          <p className={cn(SCRIPTURE_TRAINING_META, "mb-6")}>
            Type first letters in order. If a round falls short, you may step back one stage.
          </p>

          <header className="mb-6 space-y-2 border-b border-white/[0.06] pb-5">
            <p className={SCRIPTURE_TRAINING_STEP}>
              Review Stage {reviewStepNumber(reviewStage)} of 5 · {reviewStageTitle(reviewStage)}
            </p>
            <h2 className="font-serif text-lg font-light tracking-tight text-slate-100/95">
              {reviewStage === "stage_2" && stage2Lines
                ? stage2Lines.stepLabel
                : reviewStage === "stage_3" && stage3Lines
                  ? `Phrase ${stage3Lines.phrase} of ${stage3Lines.phraseTotal}`
                  : reviewStage === "stage_4" || reviewStage === "stage_5"
                    ? "Whole passage"
                    : "Review"}
            </h2>
            {reviewStage === "stage_2" && stage2Lines ? (
              <p className={SCRIPTURE_TRAINING_META}>
                Repetition {stage2Lines.rep} of {stage2Lines.repTotal} · Set {stage2Lines.stepIndex} of{" "}
                {stage2Lines.totalSteps}
              </p>
            ) : null}
            {reviewStage === "stage_3" && stage3Lines ? (
              <p className={SCRIPTURE_TRAINING_META}>
                Round {stage3Lines.round} of {stage3Lines.roundTotal}
              </p>
            ) : null}
            {reviewStage === "stage_4" ? (
              <p className={SCRIPTURE_TRAINING_META}>
                {referenceTypingToken
                  ? "Type the reference at the start and end, then the passage (every other word hidden)."
                  : "Every other word hidden (whole passage)."}
              </p>
            ) : null}
            {reviewStage === "stage_5" ? (
              <p className={SCRIPTURE_TRAINING_META}>
                {referenceTypingToken
                  ? "Type the reference at the start and end, then the passage. Words appear as you type."
                  : "Words appear as you type each first letter."}
              </p>
            ) : null}
          </header>

          {(reviewStage === "stage_2" || reviewStage === "stage_3") && item.reference?.trim() ? (
            <p className={cn(SCRIPTURE_READING_TEXT, "mb-5")}>{item.reference.trim()}</p>
          ) : null}

          {wordSlots.length > 0 ? (
            <MemorizeSequentialRecall
              roundKey={recallRoundKey}
              segments={practiceSegments}
              wordSlots={wordSlots}
              slotsByPhrase={slotsByPhrase}
              layoutMode={recallLayoutMode}
              referenceDisplayText={item.reference ?? ""}
              supportVisible={supportVisible}
              disabled={pending}
              pending={pending}
              onRoundComplete={onSubmitRound}
              onTypingActivity={clearTypingFeedback}
            />
          ) : (
            <div className={SCRIPTURE_TRAINING_META}>
              <p className="text-slate-200/90">No practice text found for this verse.</p>
              <p className="mt-2">
                Open{" "}
                <Link
                  href={`/scripture/items/${item.id}/memorize`}
                  className="text-slate-100 underline underline-offset-4"
                >
                  memorization
                </Link>{" "}
                and save phrases, or edit the verse if the text is empty.
              </p>
            </div>
          )}
        </ScriptureTrainingShell>
      </section>
      </div>
    </div>
  );
}
