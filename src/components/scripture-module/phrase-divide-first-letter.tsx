"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firstLetterMatchesWithGrace } from "@/lib/scripture-module/memorize-recall-grace";
import { SCRIPTURE_TRAINING_META } from "@/components/scripture-module/scripture-training-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function verseWordList(verseText: string): string[] {
  return verseText.trim().split(/\s+/).filter(Boolean);
}

function wordCountIn(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split parent `rows` into completed phrase lines vs the active line. Words must match `verseWords` in order.
 *
 * Row shape: each non-empty row is a phrase slice; a trailing empty row means "next phrase line" after End phrase.
 * Saved phrases like [P1, P2] (no trailing "") still hydrate when the last row completes the verse.
 */
function hydrateFromRows(
  rows: string[],
  verseWords: string[]
): { completed: string[]; current: string } {
  if (verseWords.length === 0) {
    return { completed: [], current: rows.map((r) => r.trim()).filter(Boolean).join(" ") };
  }

  const rowsT = rows.map((r) => r.trim());
  let wi = 0;
  const completed: string[] = [];

  for (let i = 0; i < rowsT.length; i++) {
    const row = rowsT[i] ?? "";
    const isLast = i === rowsT.length - 1;

    if (row === "") {
      if (!isLast) return { completed: [], current: "" };
      return { completed, current: "" };
    }

    const parts = row.split(/\s+/).filter(Boolean);
    for (const p of parts) {
      if (wi >= verseWords.length || p !== verseWords[wi]) {
        return { completed: [], current: "" };
      }
      wi++;
    }

    if (isLast) {
      if (wi === verseWords.length) {
        return { completed: [...completed, row], current: "" };
      }
      return { completed, current: row };
    }

    completed.push(row);
  }

  return { completed, current: "" };
}

/** Parent `value` must round-trip: include a trailing "" after End phrase so boundaries persist. */
function rowsFromState(completed: string[], current: string): string[] {
  const cur = current.trim();
  if (completed.length === 0 && !cur) {
    return [""];
  }
  const out = [...completed];
  if (cur) {
    out.push(cur);
  } else if (completed.length > 0) {
    out.push("");
  }
  return out;
}

export type PhraseDivideFirstLetterProps = {
  verseText: string;
  value: string[];
  onChange: (rows: string[]) => void;
  disabled?: boolean;
};

/**
 * Build phrases by typing the first letter of each word in verse order; each match inserts the full word.
 */
export function PhraseDivideFirstLetter({
  verseText,
  value,
  onChange,
  disabled,
}: PhraseDivideFirstLetterProps) {
  const verseWords = useMemo(() => verseWordList(verseText), [verseText]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

  const [completedPhrases, setCompletedPhrases] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");

  const nextWordIndex = useMemo(() => {
    let wi = 0;
    for (const p of completedPhrases) {
      wi += wordCountIn(p);
    }
    wi += wordCountIn(currentLine);
    return wi;
  }, [completedPhrases, currentLine]);

  const verseDone = verseWords.length > 0 && nextWordIndex >= verseWords.length;
  const canType = !disabled && !verseDone && verseWords.length > 0;

  const applyRows = useCallback(
    (completed: string[], current: string) => {
      setCompletedPhrases(completed);
      setCurrentLine(current);
      onChange(rowsFromState(completed, current));
    },
    [onChange]
  );

  useEffect(() => {
    const h = hydrateFromRows(value, verseWords);
    setCompletedPhrases(h.completed);
    setCurrentLine(h.current);
  }, [verseText, verseWords, value]);

  const handleChar = useCallback(
    (ch: string) => {
      if (!canType) return;
      const w = verseWords[nextWordIndex];
      if (!w) return;
      if (!firstLetterMatchesWithGrace(w, ch)) return;

      const addition = currentLine.trim() ? `${currentLine} ${w}` : w;
      applyRows(completedPhrases, addition);
    },
    [canType, verseWords, nextWordIndex, currentLine, completedPhrases, applyRows]
  );

  const focusInputSoon = useCallback(() => {
    window.setTimeout(() => {
      const el = inputRef.current;
      if (el && !el.disabled) el.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (!canType) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [canType, verseText]);

  const endPhrase = useCallback(() => {
    if (disabled) return;
    const t = currentLine.trim();
    if (!t) return;
    applyRows([...completedPhrases, t], "");
    focusInputSoon();
  }, [disabled, currentLine, completedPhrases, applyRows, focusInputSoon]);

  const undoWord = useCallback(() => {
    if (disabled) return;
    const parts = currentLine.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      applyRows(completedPhrases, parts.join(" "));
      focusInputSoon();
      return;
    }
    if (completedPhrases.length === 0) return;
    const prevPhrases = completedPhrases.slice(0, -1);
    const last = completedPhrases[completedPhrases.length - 1]!;
    applyRows(prevPhrases, last);
    focusInputSoon();
  }, [disabled, currentLine, completedPhrases, applyRows, focusInputSoon]);

  const resetAll = useCallback(() => {
    if (disabled) return;
    applyRows([], "");
    focusInputSoon();
  }, [disabled, applyRows, focusInputSoon]);

  return (
    <div className="space-y-3">
      <p className={SCRIPTURE_TRAINING_META}>
        Type the <strong className="text-slate-200">first letter</strong> of each word in order to add it to
        this phrase. Use <strong className="text-slate-200">End phrase</strong> to start the next line.{" "}
        <span className="text-slate-500">Backspace undoes the last word.</span>
      </p>

      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        tabIndex={0}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={1}
        value={draft}
        disabled={!canType}
        aria-label="Type first letter to add next word"
        onChange={(e) => {
          const v = e.target.value;
          const c = v.slice(-1);
          setDraft("");
          if (c && c !== " ") handleChar(c);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            e.preventDefault();
            undoWord();
          }
        }}
      />

      <div className="min-h-[5rem] rounded-lg border border-white/10 bg-black/15 px-3 py-3 text-left">
        {completedPhrases.map((line, i) => (
          <p key={`done-${i}`} className="font-serif text-[17px] leading-relaxed text-slate-200/95">
            {line}
          </p>
        ))}
        <p
          className={cn(
            "font-serif text-[17px] leading-relaxed",
            currentLine ? "text-slate-100/95" : "text-slate-500/70"
          )}
        >
          {currentLine || (verseDone ? "(verse complete)" : "Type first letters to build this phrase…")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-slate-200 hover:bg-white/5"
          disabled={disabled || !currentLine.trim()}
          onClick={endPhrase}
        >
          End phrase
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-slate-200 hover:bg-white/5"
          disabled={disabled || (completedPhrases.length === 0 && !currentLine.trim())}
          onClick={undoWord}
        >
          Undo word
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-slate-400 hover:bg-white/5"
          disabled={disabled || (completedPhrases.length === 0 && !currentLine.trim())}
          onClick={resetAll}
        >
          Reset
        </Button>
        {verseWords.length > 0 ? (
          <span className="text-[12px] text-slate-500">
            Word {Math.min(nextWordIndex + (verseDone ? 0 : 1), verseWords.length)} of {verseWords.length}
            {verseDone ? " · All words placed" : ""}
          </span>
        ) : null}
      </div>

      {verseWords.length === 0 ? (
        <p className="text-sm text-amber-200/90">Add verse text to the passage to use phrase builder.</p>
      ) : null}
    </div>
  );
}
