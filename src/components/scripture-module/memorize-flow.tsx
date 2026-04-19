"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  advanceMemorizeToStage2,
  getPostMasteryMyVersesNavigation,
  jumpMemorizeLadderStep,
  saveMemorizePhrases,
  submitMemorizeRound,
} from "@/app/actions/scripture-module";
import {
  ladderStepToMemorizeStage,
  memorizeProgressForLadderJump,
  memorizeStageToLadderStep,
  type MemorizeLadderStepNumber,
} from "@/lib/scripture-module/memorize-engine";
import { firstLettersForPhrase } from "@/lib/scripture-module/grip-prompts";
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
import { expectedLettersSpaced } from "@/lib/scripture-module/memorize-typing-score";
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
import type { GripMemoryDTO, MemorizeStage, ScriptureItemDTO } from "@/lib/scripture-module/types";
import { PhraseDivideFirstLetter } from "@/components/scripture-module/phrase-divide-first-letter";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FlowTab = "context" | "practice";

const TABS: { key: FlowTab; label: string }[] = [
  { key: "context", label: "Context" },
  { key: "practice", label: "Practice" },
];

const LADDER_STEPS = [1, 2, 3, 4, 5] as const satisfies readonly MemorizeLadderStepNumber[];

function ladderStepButtonTitle(step: MemorizeLadderStepNumber): string {
  if (step === 1) return "Step 1 — Context (divide into phrases)";
  const st = ladderStepToMemorizeStage(step) as "stage_2" | "stage_3" | "stage_4" | "stage_5";
  return `Step ${step} — ${practiceStageTitle(st)}`;
}

const PRACTICE_STAGES: MemorizeStage[] = ["stage_2", "stage_3", "stage_4", "stage_5"];

function isPracticeStage(s: MemorizeStage): boolean {
  return PRACTICE_STAGES.includes(s);
}

/** Display step number 1–5 for the memorization ladder (context = 1, stage_2 = 2, …). */
function ladderStepNumber(stage: MemorizeStage): number {
  switch (stage) {
    case "context":
      return 1;
    case "stage_2":
      return 2;
    case "stage_3":
      return 3;
    case "stage_4":
      return 4;
    case "stage_5":
      return 5;
    default:
      return 0;
  }
}

function stageHeading(stage: MemorizeStage): string {
  if (
    stage === "stage_2" ||
    stage === "stage_3" ||
    stage === "stage_4" ||
    stage === "stage_5"
  ) {
    return practiceStageTitle(stage);
  }
  return "";
}

function tabUnlocked(mem: GripMemoryDTO, key: FlowTab): boolean {
  if (mem.memorizeStage === "completed" || mem.gripStatus === "completed") {
    return true;
  }
  if (key === "practice") {
    return isPracticeStage(mem.memorizeStage);
  }
  return true;
}

type RoundFeedback =
  | null
  | {
      kind: "pass" | "fail";
      accuracy: number;
      message: string;
    };

export function MemorizeFlow({
  item,
  memory: initialMemory,
  inMyVerses = false,
}: {
  item: ScriptureItemDTO;
  memory: GripMemoryDTO;
  /** When true, passage is in the user's My Verses queue (mastery celebration + auto-advance). */
  inMyVerses?: boolean;
}) {
  const router = useRouter();
  const masteryTimerRef = useRef<number | null>(null);
  const [memory, setMemory] = useState(initialMemory);
  const [view, setView] = useState<FlowTab>(() => {
    if (initialMemory.memorizeStage === "completed" || initialMemory.gripStatus === "completed") {
      return "context";
    }
    if (isPracticeStage(initialMemory.memorizeStage)) return "practice";
    return "context";
  });
  const [phraseRows, setPhraseRows] = useState<string[]>(() =>
    initialMemory.phraseSegments?.length ? initialMemory.phraseSegments : [""]
  );
  const [attemptKey, setAttemptKey] = useState(0);
  const [roundFeedback, setRoundFeedback] = useState<RoundFeedback>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [queueMasteryOverlay, setQueueMasteryOverlay] = useState(false);

  useEffect(() => {
    return () => {
      if (masteryTimerRef.current != null) {
        window.clearTimeout(masteryTimerRef.current);
        masteryTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setMemory(initialMemory);
  }, [
    initialMemory.id,
    initialMemory.lastStepAt,
    initialMemory.memorizeStage,
    initialMemory.memorizeProgress,
  ]);

  useEffect(() => {
    const segs = initialMemory.phraseSegments;
    if (segs && segs.length > 0) {
      setPhraseRows(segs);
    } else if (initialMemory.memorizeStage === "context") {
      setPhraseRows([""]);
    }
  }, [
    initialMemory.id,
    initialMemory.lastStepAt,
    initialMemory.phraseSegments,
    initialMemory.memorizeStage,
  ]);

  const isDone = memory.memorizeStage === "completed" || memory.gripStatus === "completed";
  const segments = useMemo(() => memory.phraseSegments ?? [], [memory.phraseSegments]);

  const practiceSegments = useMemo(() => {
    const st = memory.memorizeStage;
    const prog = memory.memorizeProgress;
    if (st === "stage_2") {
      const steps = buildStage2MicroSteps(segments.length);
      const s2 = prog.stage2 ?? { stepIndex: 0, repIndex: 0 };
      const step = steps[Math.min(s2.stepIndex, Math.max(0, steps.length - 1))];
      return step ? segmentsForStage2MicroStep(segments, step) : [];
    }
    if (st === "stage_3") {
      const s3 = prog.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
      const pi = Math.min(Math.max(0, s3.phraseIndex), Math.max(0, segments.length - 1));
      const seg = segments[pi];
      return seg != null && String(seg).trim() ? [seg] : [];
    }
    if (st === "stage_4" || st === "stage_5") {
      return segments;
    }
    return [];
  }, [memory.memorizeStage, memory.memorizeProgress, segments]);

  const referenceTypingToken = useMemo(
    () => referenceToTypingToken(item.reference ?? ""),
    [item.reference]
  );

  const wordSlots = useMemo(() => {
    const st = memory.memorizeStage;
    const includeRef =
      (st === "stage_4" || st === "stage_5") && referenceTypingToken.length > 0;
    if (includeRef) {
      return buildRecallWordSlots(practiceSegments, referenceTypingToken, true);
    }
    return buildPhraseWordSlots(practiceSegments);
  }, [practiceSegments, memory.memorizeStage, referenceTypingToken]);

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
    const st = memory.memorizeStage;
    const n = wordSlots.length;
    if (n === 0) return [];
    if (st === "stage_2") {
      return Array(n).fill(true);
    }
    if (st === "stage_3") {
      const s3 = memory.memorizeProgress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
      const phraseWords = wordSlots.filter((w) => w.phraseIndex === 0).length;
      const hidden = stage3HiddenWordIndices(s3.roundIndex, phraseWords);
      return wordSlots.map((_, i) => Boolean(!hidden.has(i)));
    }
    if (st === "stage_4") {
      const hidden = stage4HiddenWordIndices(n);
      return wordSlots.map((_, i) => Boolean(!hidden.has(i)));
    }
    if (st === "stage_5") {
      return Array(n).fill(false);
    }
    return Array(n).fill(true);
  }, [memory.memorizeStage, memory.memorizeProgress, wordSlots]);

  const stage2Lines = useMemo(() => {
    if (memory.memorizeStage !== "stage_2" || segments.length === 0) return null;
    const steps = buildStage2MicroSteps(segments.length);
    const s2 = memory.memorizeProgress.stage2 ?? { stepIndex: 0, repIndex: 0 };
    const step = steps[Math.min(s2.stepIndex, steps.length - 1)];
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
  }, [memory.memorizeStage, memory.memorizeProgress, segments]);

  const stage3Lines = useMemo(() => {
    if (memory.memorizeStage !== "stage_3") return null;
    const s3 = memory.memorizeProgress.stage3 ?? { phraseIndex: 0, roundIndex: 0 };
    return {
      phrase: s3.phraseIndex + 1,
      phraseTotal: Math.max(1, segments.length),
      round: s3.roundIndex + 1,
      roundTotal: 2,
    };
  }, [memory.memorizeStage, memory.memorizeProgress, segments.length]);

  const recallRoundKey = useMemo(
    () => `${attemptKey}-${memory.memorizeStage}-${JSON.stringify(memory.memorizeProgress)}`,
    [attemptKey, memory.memorizeStage, memory.memorizeProgress]
  );

  const recallLayoutMode: RecallLayoutMode = useMemo(
    () =>
      memory.memorizeStage === "stage_4" || memory.memorizeStage === "stage_5" ? "passage" : "phrases",
    [memory.memorizeStage]
  );

  const refreshFromServer = useCallback(() => {
    router.refresh();
  }, [router]);

  const clearTypingFeedback = useCallback(() => {
    setRoundFeedback(null);
  }, []);

  function onNav(key: FlowTab) {
    if (!tabUnlocked(memory, key)) return;
    setRoundFeedback(null);
    setError(null);
    setView(key);
  }

  function onSelectLadderStep(step: MemorizeLadderStepNumber) {
    if (isDone) return;
    const current = memorizeStageToLadderStep(memory.memorizeStage);
    if (current === step) return;
    setError(null);
    setRoundFeedback(null);
    startTransition(async () => {
      const res = await jumpMemorizeLadderStep(item.id, step);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const targetStage = ladderStepToMemorizeStage(step);
      setMemory((prev) => ({
        ...prev,
        memorizeStage: targetStage,
        memorizeProgress: memorizeProgressForLadderJump(targetStage, prev.memorizeProgress),
      }));
      setView(step === 1 ? "context" : "practice");
      setAttemptKey((k) => k + 1);
      refreshFromServer();
    });
  }

  function onSaveContextAndPhrasesThenAdvance() {
    setError(null);
    setRoundFeedback(null);
    const cleaned = phraseRows.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setError("Divide the passage into at least one phrase.");
      return;
    }

    startTransition(async () => {
      const ph = await saveMemorizePhrases(item.id, cleaned);
      if ("error" in ph) {
        setError(ph.error);
        return;
      }
      const adv = await advanceMemorizeToStage2(item.id);
      if ("error" in adv) {
        setError(adv.error);
        return;
      }

      setPhraseRows(cleaned);
      setMemory((prev) => ({
        ...prev,
        memorizeStage: "stage_2",
        memorizeProgress: { v: 1, stage2: { stepIndex: 0, repIndex: 0 } },
        phraseSegments: cleaned,
      }));
      setAttemptKey((k) => k + 1);
      setView("practice");
      refreshFromServer();
    });
  }

  const onSubmitRound = useCallback(
    (slots: string[], wrongAttemptsParam: number) => {
      setError(null);
      setRoundFeedback(null);
      startTransition(async () => {
        const res = await submitMemorizeRound(item.id, slots, wrongAttemptsParam);
        if ("error" in res) {
          setError(res.error);
          return;
        }
        const pct = Math.round(res.accuracy * 100);
        const minPct = Math.round(MEMORIZE_PASS_ACCURACY * 100);

        if (!res.passed) {
          setRoundFeedback({
            kind: "fail",
            accuracy: res.accuracy,
            message: `Need at least ${minPct}% of words correct on the first try. Repeat this step until you pass.`,
          });
          setAttemptKey((k) => k + 1);
          return;
        }

        if (res.memorizeStage === "completed" && inMyVerses) {
          setQueueMasteryOverlay(true);
          setRoundFeedback(null);
          setAttemptKey((k) => k + 1);
          refreshFromServer();
          if (masteryTimerRef.current != null) window.clearTimeout(masteryTimerRef.current);
          masteryTimerRef.current = window.setTimeout(async () => {
            masteryTimerRef.current = null;
            const nav = await getPostMasteryMyVersesNavigation(item.id);
            if ("error" in nav) {
              setQueueMasteryOverlay(false);
              return;
            }
            router.replace(nav.href);
          }, 3000);
          return;
        }

        const passedMsg =
          res.memorizeStage === "completed"
            ? `About ${pct}% — memorization complete. Scheduled retention reviews will unlock on your rhythm.`
            : `About ${pct}% — nice work. Moving to the next step.`;

        setRoundFeedback({
          kind: "pass",
          accuracy: res.accuracy,
          message: passedMsg,
        });
        setAttemptKey((k) => k + 1);
        if (res.memorizeStage === "completed") {
          setView("context");
        }
        refreshFromServer();
      });
    },
    [inMyVerses, item.id, refreshFromServer, router]
  );

  const ladderN = ladderStepNumber(memory.memorizeStage);

  return (
    <div className="relative space-y-8">
      {queueMasteryOverlay ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background/96 px-6 text-center backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <p className="max-w-md text-lg font-medium text-foreground sm:text-xl">
            Congratulations, you mastered the verse!
          </p>
          <p className="text-sm text-muted-foreground">Continuing in a moment…</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Memorization
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">{item.reference}</h1>
          {item.translation ? (
            <p className="text-sm text-muted-foreground">{item.translation}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Link
            href={`/scripture/items/${item.id}/meditate`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Meditation
          </Link>
          <Link
            href={`/scripture/items/${item.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Back to verse
          </Link>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-border/60 pb-3"
        aria-label="Memorization steps"
      >
        {TABS.map((s) => {
          const active = view === s.key;
          const unlocked = tabUnlocked(memory, s.key);
          return (
            <button
              key={s.key}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onNav(s.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "font-medium text-foreground underline decoration-foreground/25 decoration-2 underline-offset-[7px]"
                  : unlocked
                    ? "text-muted-foreground hover:text-foreground"
                    : "cursor-not-allowed opacity-40"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      {!isDone ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Memorization steps 1 through 5"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Steps
          </span>
          <div className="flex flex-wrap gap-1">
            {LADDER_STEPS.map((step) => {
              const current = memorizeStageToLadderStep(memory.memorizeStage);
              const active = current === step;
              const needsPhrases = step >= 2 && segments.length === 0;
              return (
                <button
                  key={step}
                  type="button"
                  title={ladderStepButtonTitle(step)}
                  disabled={pending || needsPhrases}
                  onClick={() => onSelectLadderStep(step)}
                  className={cn(
                    "min-w-[2.25rem] rounded-md border px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                    active
                      ? "border-foreground/25 bg-foreground/10 text-foreground"
                      : needsPhrases
                        ? "cursor-not-allowed border-border/40 text-muted-foreground/45"
                        : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {roundFeedback ? (
        <div
          role="status"
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm",
            roundFeedback.kind === "pass"
              ? "bg-emerald-500/10 text-emerald-100/95"
              : "bg-amber-500/10 text-amber-100/95"
          )}
        >
          <p className="font-medium">
            {roundFeedback.kind === "pass" ? "Passed" : "Not quite yet"} ·{" "}
            {Math.round(roundFeedback.accuracy * 100)}%
          </p>
          <p className="mt-1 opacity-90">{roundFeedback.message}</p>
        </div>
      ) : null}

      {isDone && (
        <div className="rounded-lg bg-violet-500/10 px-4 py-3 text-sm text-violet-100/95">
          <p className="font-medium">Memorization complete</p>
          <p className="mt-1 opacity-90">
            Retention reviews are ready. When this verse is due, open the{" "}
            <Link href="/scripture/review" className="underline underline-offset-4">
              review queue
            </Link>
            .
          </p>
        </div>
      )}

      {view === "context" && (
        <section>
          <ScriptureTrainingShell>
            {error ? (
              <p
                className="mb-5 rounded-md border border-red-500/35 bg-red-950/40 px-3 py-2.5 text-sm text-red-100/95"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <header className="mb-6 space-y-2 border-b border-white/[0.06] pb-5">
              <p className={SCRIPTURE_TRAINING_STEP}>Step 1 of 5 · Context</p>
              <h2 className="font-serif text-lg font-light tracking-tight text-slate-100/95">
                Divide into phrases
              </h2>
              <p className={SCRIPTURE_TRAINING_META}>
                Type the first letter of each word in order to build each phrase; use{" "}
                <strong className="text-slate-200">End phrase</strong> between lines. Optional: reflect on
                paraphrase and meaning in{" "}
                <Link href={`/scripture/items/${item.id}/meditate`} className="text-slate-200 underline underline-offset-4">
                  Meditation
                </Link>
                .
              </p>
            </header>

            {item.reference?.trim() ? (
              <p className="mb-3 font-serif text-sm text-slate-500/85">{item.reference.trim()}</p>
            ) : null}

            <blockquote
              className={cn(
                SCRIPTURE_READING_TEXT,
                "mb-8 border-l-2 border-sky-500/20 pl-4 text-slate-200/95"
              )}
            >
              {item.verseText}
            </blockquote>

            <div className="mt-2 space-y-3">
              <Label className="text-slate-300">Phrases</Label>
              {!isDone ? (
                <PhraseDivideFirstLetter
                  verseText={item.verseText}
                  value={phraseRows}
                  onChange={setPhraseRows}
                  disabled={pending}
                />
              ) : (
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/15 px-3 py-3">
                  {phraseRows
                    .map((r) => r.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <p key={i} className="font-serif text-[17px] leading-relaxed text-slate-200/95">
                        {line}
                      </p>
                    ))}
                </div>
              )}
            </div>

            {segments.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-white/[0.06] pt-8">
                <p className="text-sm text-slate-200/90">Pattern check</p>
                <p className={SCRIPTURE_TRAINING_META}>
                  First letter of each word — notice the shape of the passage before practice.
                </p>
                <ul className="space-y-5">
                  {segments.map((phrase, i) => (
                    <li key={i} className="space-y-1.5">
                      <p className={cn(SCRIPTURE_READING_TEXT, "text-slate-200/90")}>{phrase}</p>
                      <p className="font-mono text-[13px] tracking-wide text-slate-500">
                        {firstLettersForPhrase(phrase)}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className={cn(SCRIPTURE_TRAINING_META, "pt-1")}>
                  Whole verse:{" "}
                  <span className="font-mono text-slate-400">{expectedLettersSpaced(segments)}</span>
                </p>
              </div>
            )}

            {!isDone && memory.memorizeStage === "context" ? (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.06] pt-6">
                <Button
                  type="button"
                  className="bg-sky-600 text-white hover:bg-sky-500"
                  onClick={onSaveContextAndPhrasesThenAdvance}
                  disabled={pending}
                >
                  {pending ? "Starting…" : "Save and begin Step 2"}
                </Button>
              </div>
            ) : null}

            {!isDone && isPracticeStage(memory.memorizeStage) ? (
              <p className={cn(SCRIPTURE_TRAINING_META, "mt-6 border-t border-white/[0.06] pt-6")}>
                You&apos;re in practice (Step {ladderN} of 5). Open the{" "}
                <strong className="text-slate-200">Practice</strong> tab to continue.
              </p>
            ) : null}
          </ScriptureTrainingShell>
        </section>
      )}

      {view === "practice" &&
        segments.length === 0 &&
        !isDone &&
        isPracticeStage(memory.memorizeStage) && (
          <ScriptureTrainingShell>
            <p className="text-sm text-slate-200/90">Phrases missing</p>
            <p className={cn(SCRIPTURE_TRAINING_META, "mt-2")}>
              Practice needs saved phrases. Open the <strong className="text-slate-200">Context</strong> tab,
              divide the verse into lines, and save—then return here.
            </p>
          </ScriptureTrainingShell>
        )}

      {view === "practice" && segments.length > 0 && !isDone && isPracticeStage(memory.memorizeStage) && (
        <section>
          <ScriptureTrainingShell>
            {error ? (
              <p
                className="mb-5 rounded-md border border-red-500/35 bg-red-950/40 px-3 py-2.5 text-sm text-red-100/95"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <header className="mb-6 space-y-2 border-b border-white/[0.06] pb-5">
              <p className={SCRIPTURE_TRAINING_STEP}>
                Step {ladderN} of 5 · {stageHeading(memory.memorizeStage)}
              </p>
              <h2 className="font-serif text-lg font-light tracking-tight text-slate-100/95">
                {memory.memorizeStage === "stage_2" && stage2Lines
                  ? stage2Lines.stepLabel
                  : memory.memorizeStage === "stage_3" && stage3Lines
                    ? `Phrase ${stage3Lines.phrase} of ${stage3Lines.phraseTotal}`
                    : memory.memorizeStage === "stage_4"
                      ? "Whole passage"
                      : memory.memorizeStage === "stage_5"
                        ? "Whole passage"
                        : "Practice"}
              </h2>

              {memory.memorizeStage === "stage_2" && stage2Lines ? (
                <p className={SCRIPTURE_TRAINING_META}>
                  Repetition {stage2Lines.rep} of {stage2Lines.repTotal} · Phrase set{" "}
                  {stage2Lines.stepIndex} of {stage2Lines.totalSteps}
                </p>
              ) : null}

              {memory.memorizeStage === "stage_3" && stage3Lines ? (
                <p className={SCRIPTURE_TRAINING_META}>
                  Round {stage3Lines.round} of {stage3Lines.roundTotal} (odd words hidden, then even)
                </p>
              ) : null}

              {memory.memorizeStage === "stage_4" ? (
                <p className={SCRIPTURE_TRAINING_META}>
                  {referenceTypingToken
                    ? "Type the reference at the start and end, then the passage (every other word hidden). Follow the on-screen order."
                    : "Every other word is hidden (whole passage). Type every first letter in order."}
                </p>
              ) : null}

              {memory.memorizeStage === "stage_5" ? (
                <p className={SCRIPTURE_TRAINING_META}>
                  {referenceTypingToken
                    ? "Type the reference at the start and end, then the passage. Words appear as you go."
                    : "Words appear as you get each one. Type every first letter in order."}
                </p>
              ) : null}
            </header>

            {(memory.memorizeStage === "stage_2" || memory.memorizeStage === "stage_3") &&
            item.reference?.trim() ? (
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
              <p className={SCRIPTURE_TRAINING_META}>Nothing to practice yet.</p>
            )}
          </ScriptureTrainingShell>
        </section>
      )}
    </div>
  );
}
