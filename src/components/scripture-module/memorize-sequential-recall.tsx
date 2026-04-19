"use client";

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { firstLetterMatchesWithGrace } from "@/lib/scripture-module/memorize-recall-grace";
import {
  REF_PHRASE_PREFIX,
  REF_PHRASE_SUFFIX,
  type PhraseWordSlot,
} from "@/lib/scripture-module/memorize-support-pattern";
import { firstLetterFromWord } from "@/lib/scripture-module/memorize-words";
import { MEMORIZE_PASS_ACCURACY } from "@/lib/scripture-module/memorize-scoring-engine";
import { SCRIPTURE_READING_TEXT, SCRIPTURE_TRAINING_META } from "@/components/scripture-module/scripture-training-shell";
import { cn } from "@/lib/utils";

/** Hidden slots: keep full word in DOM for identical wrapping; no readable pixels (not faded/ghost). */
const HIDDEN_WORD_FOOTPRINT = "text-transparent [text-shadow:none] select-none";

const RECALL_INSTRUCTIONS_BASE =
  `Type the first letter of each word in order. A wrong letter marks that word wrong (red) and moves on — ` +
  `no retries on the same word. At the end you need at least ${Math.round(MEMORIZE_PASS_ACCURACY * 100)}% of words ` +
  `correct on the first try to pass this repetition.`;

const RECALL_INSTRUCTIONS_WITH_REF =
  `Begin with the reference, then each passage word, then the reference again (same order as scoring). ` +
  `Wrong characters mark that slot wrong and advance. Words brighten after a correct first letter. ` +
  `Finish at ${Math.round(MEMORIZE_PASS_ACCURACY * 100)}% word accuracy or higher to pass.`;

function slotSection(phraseIndex: number): "prefix" | "body" | "suffix" {
  if (phraseIndex === REF_PHRASE_PREFIX) return "prefix";
  if (phraseIndex === REF_PHRASE_SUFFIX) return "suffix";
  return "body";
}

type ReferenceDisplayLineProps = {
  displayText: string;
  slotIndices: number[];
  completed: boolean[];
  activeGlobal: number | null;
  missedWord: boolean[];
  supportVisible: boolean[];
  position: "start" | "end";
  /** When true, flows inline with passage text (same line / wrapping as body). */
  inline?: boolean;
};

const REF_CHAR =
  "inline-block max-w-full transition-[opacity,color,text-shadow,text-decoration-color] duration-200";

/** Reference string (e.g. Romans 10:9); typography matches {@link SCRIPTURE_READING_TEXT} passage line. */
const ReferenceDisplayLine = memo(function ReferenceDisplayLine({
  displayText,
  slotIndices,
  completed,
  activeGlobal,
  missedWord,
  supportVisible,
  position,
  inline = false,
}: ReferenceDisplayLineProps) {
  const t = displayText.trim();
  if (slotIndices.length === 0 || !t) return null;

  const chars = [...t];
  const perChar = chars.length === slotIndices.length;

  const outerClass = cn(
    SCRIPTURE_READING_TEXT,
    inline ? "inline" : "block",
    !inline && position === "start" && "mb-1",
    !inline && position === "end" && "mt-1"
  );

  if (perChar) {
    const Inner = inline ? "span" : "p";
    return (
      <Inner className={outerClass} data-reference-marker={position}>
        {slotIndices.map((gi, i) => {
          const ch = chars[i] ?? "";
          const isDone = completed[gi];
          const isActive = activeGlobal === gi;
          const missed = missedWord[gi];
          const showHint = supportVisible[gi] ?? false;
          return (
            <span
              key={`ref-${gi}`}
              className={cn(
                REF_CHAR,
                isDone &&
                  "text-slate-50 [text-shadow:0_0_16px_rgba(186,230,253,0.28),0_0_1px_rgba(255,255,255,0.12)]",
                !isDone &&
                  missed &&
                  "text-red-400/95 underline decoration-red-400/40 decoration-1 underline-offset-[4px]",
                !isDone &&
                  !missed &&
                  isActive &&
                  showHint &&
                  "text-slate-100 opacity-100 underline decoration-sky-400/45 decoration-1 underline-offset-[4px]",
                !isDone &&
                  !missed &&
                  isActive &&
                  !showHint &&
                  HIDDEN_WORD_FOOTPRINT,
                !isDone &&
                  !missed &&
                  !isActive &&
                  !showHint &&
                  HIDDEN_WORD_FOOTPRINT,
                !isDone && !missed && !isActive && showHint && "text-slate-400/90 opacity-90"
              )}
            >
              {ch}
            </span>
          );
        })}
      </Inner>
    );
  }

  const allDone = slotIndices.every((i) => completed[i]);
  const anyActive = slotIndices.some((i) => activeGlobal === i);
  const showHint = slotIndices.some((i) => supportVisible[i] ?? false);
  const anyMissed = slotIndices.some((i) => missedWord[i]);
  const awaiting = !allDone && !anyActive;
  const hiddenNoHint = awaiting && !showHint;

  const Inner = inline ? "span" : "p";
  return (
    <Inner className={outerClass} data-reference-marker={position}>
      <span
        className={cn(
          REF_CHAR,
          allDone &&
            "text-slate-50 [text-shadow:0_0_16px_rgba(186,230,253,0.28),0_0_1px_rgba(255,255,255,0.12)]",
          !allDone && anyMissed && "text-red-400/90 opacity-100",
          !allDone && hiddenNoHint && !anyActive && !anyMissed && HIDDEN_WORD_FOOTPRINT,
          !allDone && showHint && !anyActive && !anyMissed && "text-slate-400/90 opacity-90",
          !allDone &&
            !anyMissed &&
            anyActive &&
            showHint &&
            "text-slate-100 opacity-100 underline decoration-sky-400/45 decoration-1 underline-offset-[4px]",
          !allDone &&
            !anyMissed &&
            anyActive &&
            !showHint &&
            "text-slate-200/95 opacity-100 underline decoration-sky-400/40 decoration-1 underline-offset-[4px]"
        )}
      >
        {t}
      </span>
    </Inner>
  );
});

/** `phrases`: grouped by phrase with labels (Stage 2–3). `passage`: one flowing paragraph (Stage 4–5). */
export type RecallLayoutMode = "phrases" | "passage";

export type MemorizeSequentialRecallProps = {
  /** Stable key to reset internal state when the exercise unit changes */
  roundKey: string;
  segments: string[];
  wordSlots: PhraseWordSlot[];
  slotsByPhrase: Map<number, PhraseWordSlot[]>;
  /** How to lay out the verse text for the user (does not change scoring order). */
  layoutMode: RecallLayoutMode;
  /**
   * Visible scripture reference (e.g. `Romans 10:9`) for whole-passage steps that include reference markers.
   * Typing/scoring still uses the internal normalized token per slot; this is display-only.
   */
  referenceDisplayText?: string;
  /**
   * Per global word index: when true and word not yet completed, show the word as a visible hint.
   * When false, show a placeholder until the word is completed.
   */
  supportVisible: boolean[];
  disabled: boolean;
  pending: boolean;
  onRoundComplete: (letterSlots: string[], wrongAttempts: number) => void;
  /** Called when the user types a character (clears parent pass/fail strip, etc.). */
  onTypingActivity?: () => void;
};

type WordTokenProps = {
  slot: PhraseWordSlot;
  layoutMode: RecallLayoutMode;
  isDone: boolean;
  isActive: boolean;
  showHint: boolean;
  missed: boolean;
};

const MemoWordToken = memo(function MemoWordToken({
  slot,
  layoutMode,
  isDone,
  isActive,
  showHint,
  missed,
}: WordTokenProps) {
  const needsLetter = !!firstLetterFromWord(slot.word);
  if (!needsLetter) {
    return (
      <span className="text-slate-400/85 [overflow-wrap:anywhere] [word-break:break-word]">{slot.word}</span>
    );
  }

  const showWordAsHint = showHint && !isDone;

  /** Phrase mode: full words in DOM; hidden = transparent text (same footprint, unreadable). */
  if (layoutMode === "phrases") {
    const content = slot.word;
    return (
      <span
        data-word-slot={slot.globalWordIndex}
        className={cn(
          "inline max-w-full break-words align-baseline transition-[color,text-shadow,text-decoration-color] duration-200",
          isDone &&
            "text-slate-50 [text-shadow:0_0_16px_rgba(186,230,253,0.32),0_0_1px_rgba(255,255,255,0.14)]",
          !isDone && missed && "text-red-400/95 underline decoration-red-400/45 decoration-1 underline-offset-[5px]",
          !isDone && !missed && showWordAsHint && "text-slate-300/90 opacity-95",
          !isDone && !missed && !showWordAsHint && HIDDEN_WORD_FOOTPRINT
        )}
      >
        {content}
      </span>
    );
  }

  // Whole-passage: same layout as full verse; hidden words = transparent (no ghost).
  const content = slot.word;

  return (
    <span
      data-word-slot={slot.globalWordIndex}
      className={cn(
        "inline max-w-full align-baseline [overflow-wrap:anywhere] [word-break:break-word]",
        "transition-[color,text-shadow,text-decoration-color] duration-200",
        isDone &&
          "text-slate-50 [text-shadow:0_0_16px_rgba(186,230,253,0.3),0_0_1px_rgba(255,255,255,0.12)]",
        !isDone && missed && "text-red-400/95 underline decoration-red-400/45 decoration-1 underline-offset-[6px]",
        !isDone && !missed && showWordAsHint && "text-slate-300/88 opacity-90",
        !isDone && !missed && !showWordAsHint && HIDDEN_WORD_FOOTPRINT
      )}
    >
      {content}
    </span>
  );
}, areWordTokenPropsEqual);

function areWordTokenPropsEqual(a: WordTokenProps, b: WordTokenProps): boolean {
  return (
    a.slot.globalWordIndex === b.slot.globalWordIndex &&
    a.slot.word === b.slot.word &&
    a.layoutMode === b.layoutMode &&
    a.isDone === b.isDone &&
    a.isActive === b.isActive &&
    a.showHint === b.showHint &&
    a.missed === b.missed
  );
}

/**
 * Single-letter sequential recall: invisible focused input captures keys; passage is the UI.
 */
export function MemorizeSequentialRecall({
  roundKey,
  segments,
  wordSlots,
  slotsByPhrase,
  layoutMode,
  referenceDisplayText = "",
  supportVisible,
  disabled,
  pending,
  onRoundComplete,
  onTypingActivity,
}: MemorizeSequentialRecallProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completionSentRef = useRef(false);
  const letterSlotsRef = useRef<string[]>([]);
  const wrongAttemptsRef = useRef(0);

  const [draft, setDraft] = useState("");
  const [step, setStep] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(() => Array(wordSlots.length).fill(false));
  /** Wrong first try for this attempt; stays red until the round resets (no on-the-spot retry). */
  const [missedWord, setMissedWord] = useState<boolean[]>(() => Array(wordSlots.length).fill(false));

  const includesReferenceMarkers = useMemo(
    () => wordSlots.some((s) => s.phraseIndex === REF_PHRASE_PREFIX),
    [wordSlots]
  );

  const { prefixIndices, suffixIndices, bodySlots } = useMemo(() => {
    const prefixIndices: number[] = [];
    const suffixIndices: number[] = [];
    const bodySlots: PhraseWordSlot[] = [];
    for (const s of wordSlots) {
      if (s.phraseIndex === REF_PHRASE_PREFIX) prefixIndices.push(s.globalWordIndex);
      else if (s.phraseIndex === REF_PHRASE_SUFFIX) suffixIndices.push(s.globalWordIndex);
      else bodySlots.push(s);
    }
    return { prefixIndices, suffixIndices, bodySlots };
  }, [wordSlots]);

  const showFullReferenceLayout =
    layoutMode === "passage" && includesReferenceMarkers && referenceDisplayText.trim().length > 0;

  const recallInstructionsText = includesReferenceMarkers
    ? RECALL_INSTRUCTIONS_WITH_REF
    : RECALL_INSTRUCTIONS_BASE;

  const scoringIndices = useMemo(
    () => wordSlots.map((s, i) => (firstLetterFromWord(s.word) ? i : -1)).filter((i) => i >= 0),
    [wordSlots]
  );

  const activeGlobal =
    scoringIndices.length > 0 && step < scoringIndices.length ? scoringIndices[step] : null;

  const nWords = scoringIndices.length;

  const bodyGlobalSet = useMemo(
    () => new Set(bodySlots.map((s) => s.globalWordIndex)),
    [bodySlots]
  );

  const { firstBodyStep, lastBodyStep } = useMemo(() => {
    let first = -1;
    let last = -1;
    for (let si = 0; si < scoringIndices.length; si++) {
      const gi = scoringIndices[si]!;
      if (bodyGlobalSet.has(gi)) {
        if (first < 0) first = si;
        last = si;
      }
    }
    return { firstBodyStep: first, lastBodyStep: last };
  }, [scoringIndices, bodyGlobalSet]);

  /** Fades the opening reference as the user moves through passage words; gone before suffix typing. */
  const topReferenceFadeOpacity = useMemo(() => {
    if (!showFullReferenceLayout || prefixIndices.length === 0) return 1;
    if (firstBodyStep < 0 || lastBodyStep < 0) return 1;
    if (step < firstBodyStep) return 1;
    if (step > lastBodyStep) return 0;
    if (lastBodyStep === firstBodyStep) return step < firstBodyStep ? 1 : 0;
    return 1 - (step - firstBodyStep) / (lastBodyStep - firstBodyStep);
  }, [showFullReferenceLayout, prefixIndices.length, firstBodyStep, lastBodyStep, step]);

  useEffect(() => {
    completionSentRef.current = false;
    setDraft("");
    setStep(0);
    wrongAttemptsRef.current = 0;
    setWrongAttempts(0);
    letterSlotsRef.current = Array(wordSlots.length).fill("");
    setCompleted(Array(wordSlots.length).fill(false));
    setMissedWord(Array(wordSlots.length).fill(false));
  }, [roundKey, wordSlots.length]);

  useLayoutEffect(() => {
    if (disabled || pending) return;
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [disabled, pending, step, activeGlobal, roundKey]);

  const renderScorableToken = useCallback(
    (slot: PhraseWordSlot) => {
      const gi = slot.globalWordIndex;
      const needsLetter = !!firstLetterFromWord(slot.word);
      const isDone = completed[gi];
      const isActive = activeGlobal === gi;
      const showHint = supportVisible[gi] ?? false;
      const missed = missedWord[gi];
      const wordKey = `w-${gi}`;
      if (!needsLetter) {
        return (
          <MemoWordToken
            key={wordKey}
            slot={slot}
            layoutMode={layoutMode}
            isDone={false}
            isActive={false}
            showHint={false}
            missed={false}
          />
        );
      }
      return (
        <MemoWordToken
          key={wordKey}
          slot={slot}
          layoutMode={layoutMode}
          isDone={isDone}
          isActive={isActive}
          showHint={showHint}
          missed={missed}
        />
      );
    },
    [layoutMode, completed, activeGlobal, supportVisible, missedWord]
  );

  const handleChar = useCallback(
    (typed: string) => {
      if (disabled || pending || activeGlobal == null) return;
      const g = activeGlobal;
      const slot = wordSlots[g];
      const isLast = step === scoringIndices.length - 1;

      const finishRound = () => {
        if (completionSentRef.current) return;
        completionSentRef.current = true;
        const slotsSnapshot = [...letterSlotsRef.current];
        const wa = wrongAttemptsRef.current;
        queueMicrotask(() => onRoundComplete(slotsSnapshot, wa));
      };

      if (firstLetterMatchesWithGrace(slot.word, typed)) {
        const canon = firstLetterFromWord(slot.word)!;
        letterSlotsRef.current[g] = canon;
        setCompleted((prev) => {
          const n = [...prev];
          n[g] = true;
          return n;
        });
        if (isLast) {
          setStep(scoringIndices.length);
          finishRound();
        } else {
          setStep((s) => s + 1);
        }
      } else {
        wrongAttemptsRef.current += 1;
        setWrongAttempts(wrongAttemptsRef.current);
        setMissedWord((prev) => {
          const n = [...prev];
          n[g] = true;
          return n;
        });
        if (isLast) {
          setStep(scoringIndices.length);
          finishRound();
        } else {
          setStep((s) => s + 1);
        }
      }
      setDraft("");
    },
    [disabled, pending, activeGlobal, wordSlots, step, scoringIndices, onRoundComplete]
  );

  const instructionsId = `recall-instructions-${roundKey}`;
  const inputId = `mem-recall-${roundKey}`;
  const canType = !disabled && !pending && nWords > 0 && activeGlobal != null;

  const focusHiddenInput = useCallback(() => {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }, []);

  return (
    <div className="space-y-5">
      <p id={instructionsId} className={SCRIPTURE_TRAINING_META}>
        {recallInstructionsText}
      </p>

      {/* Visually hidden; remains focused for reliable letter capture (same behavior as prior visible field). */}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="text"
        tabIndex={0}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled || pending || nWords === 0 || activeGlobal == null}
        className="sr-only"
        maxLength={1}
        value={draft}
        aria-label={
          includesReferenceMarkers
            ? "Type the next character in the reference or the first letter of the current passage word"
            : "Type the first letter of the current word"
        }
        aria-describedby={instructionsId}
        onChange={(e) => {
          const v = e.target.value;
          const ch = v.slice(-1);
          if (ch) {
            onTypingActivity?.();
          }
          setDraft(ch);
          if (ch) handleChar(ch);
        }}
      />

      <div
        className={cn(layoutMode === "phrases" ? "space-y-7" : "", canType && "cursor-text")}
        onClick={(e) => {
          if (!canType) return;
          if ((e.target as HTMLElement).closest("a,button")) return;
          focusHiddenInput();
        }}
      >
        {layoutMode === "passage" ? (
          showFullReferenceLayout ? (
            <div className="flex flex-col gap-3">
              <div className="transition-opacity duration-500 ease-out" style={{ opacity: topReferenceFadeOpacity }}>
                <ReferenceDisplayLine
                  displayText={referenceDisplayText}
                  slotIndices={prefixIndices}
                  completed={completed}
                  activeGlobal={activeGlobal}
                  missedWord={missedWord}
                  supportVisible={supportVisible}
                  position="start"
                />
              </div>
              <p className={SCRIPTURE_READING_TEXT}>
                {bodySlots.map((slot, idx) => (
                  <Fragment key={`w-${slot.globalWordIndex}`}>
                    {idx > 0 ? <span className="select-none">&nbsp;</span> : null}
                    {renderScorableToken(slot)}
                  </Fragment>
                ))}
                {suffixIndices.length > 0 ? (
                  <>
                    <span className="select-none">&nbsp;</span>
                    <ReferenceDisplayLine
                      displayText={referenceDisplayText}
                      slotIndices={suffixIndices}
                      completed={completed}
                      activeGlobal={activeGlobal}
                      missedWord={missedWord}
                      supportVisible={supportVisible}
                      position="end"
                      inline
                    />
                  </>
                ) : null}
              </p>
            </div>
          ) : (
            <p className={SCRIPTURE_READING_TEXT}>
              {wordSlots.map((slot, idx) => {
                const prev = idx > 0 ? wordSlots[idx - 1]! : null;
                const gap =
                  idx === 0 ? null : prev && slotSection(prev.phraseIndex) !== slotSection(slot.phraseIndex) ? (
                    <span className="select-none text-slate-500/35" aria-hidden>
                      {" · "}
                    </span>
                  ) : (
                    <span className="select-none">&nbsp;</span>
                  );
                return (
                  <Fragment key={`w-${slot.globalWordIndex}`}>
                    {gap}
                    {renderScorableToken(slot)}
                  </Fragment>
                );
              })}
            </p>
          )
        ) : segments.length > 1 ? (
          <div className="space-y-2.5">
            <p className={SCRIPTURE_READING_TEXT}>
              {wordSlots.map((slot, idx) => (
                <Fragment key={`w-${slot.globalWordIndex}`}>
                  {idx > 0 ? <span className="select-none">&nbsp;</span> : null}
                  {renderScorableToken(slot)}
                </Fragment>
              ))}
            </p>
          </div>
        ) : (
          segments.map((_, pi) => {
            const inPhrase = slotsByPhrase.get(pi) ?? [];
            return (
              <div key={`phrase-${pi}`} className="space-y-2.5">
                <p className={SCRIPTURE_READING_TEXT}>
                  {inPhrase.map((slot, idx) => (
                    <Fragment key={`w-${slot.globalWordIndex}`}>
                      {idx > 0 ? <span className="select-none">&nbsp;</span> : null}
                      {renderScorableToken(slot)}
                    </Fragment>
                  ))}
                </p>
              </div>
            );
          })
        )}
      </div>

      {nWords > 0 ? (
        <p className="text-[12px] text-slate-500/85">
          {includesReferenceMarkers ? "Step" : "Word"} {step + 1} of {nWords}
          {wrongAttempts > 0 ? <> · Misses: {wrongAttempts}</> : null}
        </p>
      ) : (
        <p className="text-[12px] text-slate-500/80">Nothing to practice in this unit.</p>
      )}
    </div>
  );
}
