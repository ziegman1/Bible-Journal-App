"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from "react";
import { saveThirdsPersonalDbsObservation } from "@/app/actions/thirds-personal";
import type {
  ThirdsPersonalDbsObservationDTO,
  ThirdsPersonalDbsObservationType,
} from "@/lib/groups/thirds-personal-types";
import { meetingTextareaClass, meetingYourLabel } from "@/components/groups/meeting-input-layout";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatObservationVerseRefShort } from "@/lib/groups/observation-verse-ref";
import { toast } from "sonner";

type VersePickPhase = "idle" | "picked_first" | "ready";

const REQUIRED_DISCOVERY: ThirdsPersonalDbsObservationType[] = [
  "like",
  "difficult",
  "teaches_about_people",
  "teaches_about_god",
];

/** Client-side mirror of “four saved observations” so Finish can advance after a no-op save. */
function weekHasAllFourDiscovery(rows: ThirdsPersonalDbsObservationDTO[] | undefined): boolean {
  if (!rows?.length) return false;
  return REQUIRED_DISCOVERY.every((t) => {
    const o = rows.find((r) => r.observation_type === t);
    return (
      o != null &&
      String(o.note ?? "").trim().length > 0 &&
      Number.isFinite(Number(o.verse_number)) &&
      Number(o.verse_number) > 0
    );
  });
}

export type SoloDbsObservationFieldHandle = {
  /** Persist the current draft if needed; returns whether navigation may proceed. */
  saveUncommittedObservation: () => Promise<boolean>;
};

export const SoloDbsObservationField = forwardRef(function SoloDbsObservationField(
  {
    observationType,
    anchor,
    passageVerses,
    readOnly,
    disabled,
    initialRow,
    weekDbsObservations,
    onPersistSuccess,
    onDbsLookUpDiscoveryComplete,
    /** When set (guest mode), persist without calling the Supabase server action. */
    persistDbsObservation,
  }: {
    observationType: ThirdsPersonalDbsObservationType;
    anchor: { book: string; chapter: number } | null;
    passageVerses: { verse: number; text: string }[];
    readOnly: boolean;
    disabled: boolean;
    initialRow: ThirdsPersonalDbsObservationDTO | undefined;
    /** All observation rows for this week (used to advance to Look Forward when Finish has nothing new to save). */
    weekDbsObservations?: ThirdsPersonalDbsObservationDTO[];
    onPersistSuccess?: () => void;
    /** Fired after a successful save when all four DBS discovery observations are complete for the week. */
    onDbsLookUpDiscoveryComplete?: () => void;
    persistDbsObservation?: (input: {
      observationType: ThirdsPersonalDbsObservationType;
      book: string;
      chapter: number;
      verseNumber: number;
      verseEnd: number | null;
      note: string;
    }) => Promise<{ error: string } | { ok: true; dbsLookUpDiscoveryComplete: boolean }>;
  },
  ref: Ref<SoloDbsObservationFieldHandle>
) {
  const verseNums = useMemo(
    () => passageVerses.map((v) => v.verse).sort((a, b) => a - b),
    [passageVerses]
  );
  const verseMin = verseNums[0] ?? 1;
  const verseMax = verseNums[verseNums.length - 1] ?? verseMin;
  const hasPassageText = passageVerses.length > 0 && anchor != null;

  const [pickPhase, setPickPhase] = useState<VersePickPhase>("idle");
  const [firstVerse, setFirstVerse] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [typeSnap, setTypeSnap] = useState(observationType);
  if (observationType !== typeSnap) {
    setTypeSnap(observationType);
    setPickPhase("idle");
    setFirstVerse(null);
    setRangeEnd(null);
    setNote("");
  }

  useEffect(() => {
    const row = initialRow;
    if (!row) {
      setPickPhase("idle");
      setFirstVerse(null);
      setRangeEnd(null);
      setNote("");
      return;
    }
    setNote(row.note ?? "");
    setPickPhase("idle");
    setFirstVerse(null);
    setRangeEnd(null);
  }, [
    observationType,
    initialRow?.id,
    initialRow?.note,
    initialRow?.verse_number,
    initialRow?.verse_end,
  ]);

  const selStart =
    pickPhase === "ready" && firstVerse != null && rangeEnd != null
      ? Math.min(firstVerse, rangeEnd)
      : pickPhase === "picked_first" && firstVerse != null
        ? firstVerse
        : null;
  const selEnd =
    pickPhase === "ready" && firstVerse != null && rangeEnd != null
      ? Math.max(firstVerse, rangeEnd)
      : pickPhase === "picked_first" && firstVerse != null
        ? firstVerse
        : null;

  function verseHighlighted(v: number): boolean {
    if (selStart == null || selEnd == null) return false;
    return v >= selStart && v <= selEnd;
  }

  function handleVerseClick(verseNum: number) {
    if (readOnly || disabled || !hasPassageText) return;
    if (pickPhase === "ready") return;
    if (verseNum < verseMin || verseNum > verseMax) return;

    if (pickPhase === "idle") {
      setFirstVerse(verseNum);
      setPickPhase("picked_first");
      return;
    }
    if (pickPhase === "picked_first" && firstVerse != null) {
      setRangeEnd(verseNum);
      setPickPhase("ready");
    }
  }

  function handleClearSelection() {
    setPickPhase("idle");
    setFirstVerse(null);
    setRangeEnd(null);
    setNote("");
  }

  const commitObservation = useCallback(async (): Promise<
    { error: string } | { ok: true; dbsLookUpDiscoveryComplete: boolean }
  > => {
    if (!anchor) return { error: "Passage reference is missing." };
    if (!hasPassageText) {
      return { error: "Passage text isn’t available for this reference." };
    }
    if (pickPhase !== "ready" || firstVerse == null || rangeEnd == null) {
      return { error: "Select a verse range first." };
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return { error: "Write your observation before saving." };
    }
    const vS = Math.min(firstVerse, rangeEnd);
    const vE = Math.max(firstVerse, rangeEnd);
    if (vS < verseMin || vE > verseMax) {
      return { error: `Choose verses between ${verseMin} and ${verseMax}.` };
    }
    const payload = {
      observationType,
      book: anchor.book,
      chapter: anchor.chapter,
      verseNumber: vS,
      verseEnd: vE !== vS ? vE : null,
      note: trimmed,
    };
    const r = persistDbsObservation
      ? await persistDbsObservation(payload)
      : await saveThirdsPersonalDbsObservation(payload);
    if ("error" in r) return { error: r.error };
    return { ok: true, dbsLookUpDiscoveryComplete: r.dbsLookUpDiscoveryComplete };
  }, [
    anchor,
    hasPassageText,
    pickPhase,
    firstVerse,
    rangeEnd,
    note,
    verseMin,
    verseMax,
    observationType,
    persistDbsObservation,
  ]);

  const trimmedNote = note.trim();
  const obsReady =
    pickPhase === "ready" &&
    firstVerse != null &&
    rangeEnd != null &&
    trimmedNote.length > 0;
  const draftVs = obsReady ? Math.min(firstVerse!, rangeEnd!) : null;
  const draftVe = obsReady ? Math.max(firstVerse!, rangeEnd!) : null;

  const savedNote = (initialRow?.note ?? "").trim();
  const savedVn = initialRow?.verse_number;
  const savedVe = initialRow?.verse_end;

  const savedObsKey =
    initialRow != null && savedVn != null
      ? JSON.stringify({
          observationType,
          obsReady: true,
          draftVs: savedVn,
          draftVe: savedVe != null && savedVe !== savedVn ? savedVe : savedVn,
          n: savedNote,
        })
      : "";

  const obsDirtyKey = JSON.stringify({
    observationType,
    obsReady,
    draftVs,
    draftVe,
    n: trimmedNote,
  });

  const saveUncommittedObservation = useCallback(async (): Promise<boolean> => {
    if (readOnly) return true;
    if (pickPhase === "picked_first") {
      toast.error("Finish choosing a verse range (tap the end verse, or the same verse again) before continuing.");
      return false;
    }
    if (pickPhase !== "ready") {
      if (initialRow?.id) {
        if (
          observationType === "teaches_about_god" &&
          weekHasAllFourDiscovery(weekDbsObservations)
        ) {
          onDbsLookUpDiscoveryComplete?.();
        }
        return true;
      }
      toast.error("Select verses and add an observation before continuing.");
      return false;
    }
    if (savedObsKey !== "" && obsDirtyKey === savedObsKey) {
      handleClearSelection();
      if (
        observationType === "teaches_about_god" &&
        weekHasAllFourDiscovery(weekDbsObservations)
      ) {
        onDbsLookUpDiscoveryComplete?.();
      }
      return true;
    }
    const r = await commitObservation();
    if ("error" in r) {
      toast.error(r.error);
      return false;
    }
    toast.success("Observation saved");
    handleClearSelection();
    onPersistSuccess?.();
    if (r.dbsLookUpDiscoveryComplete) {
      onDbsLookUpDiscoveryComplete?.();
    }
    return true;
  }, [
    readOnly,
    pickPhase,
    observationType,
    initialRow?.id,
    savedObsKey,
    obsDirtyKey,
    commitObservation,
    weekDbsObservations,
    onPersistSuccess,
    onDbsLookUpDiscoveryComplete,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      saveUncommittedObservation,
    }),
    [saveUncommittedObservation]
  );

  const selectionRefShort =
    pickPhase === "ready" && selStart != null && selEnd != null
      ? formatObservationVerseRefShort(selStart, selEnd !== selStart ? selEnd : null)
      : null;

  const savedRefShort =
    savedVn != null
      ? formatObservationVerseRefShort(
          savedVn,
          savedVe != null && savedVe !== savedVn ? savedVe : null
        )
      : null;

  return (
    <div className="mt-6 border-t border-border/70 pt-6">
      <p className="text-sm leading-snug text-muted-foreground">
        Select the verse or verses that answer this question and write what you notice. It is saved when you tap the
        primary button below to continue (for example <span className="font-medium text-foreground">Next question</span>{" "}
        or <span className="font-medium text-foreground">Finish</span> on the last prompt).
      </p>

      {anchor && passageVerses.length > 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-card/60 shadow-sm">
          <p className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
            {anchor.book} {anchor.chapter}
          </p>
          <div className="max-h-60 overflow-y-auto px-2 py-2 sm:max-h-72">
            <div className="space-y-0.5">
              {passageVerses.map((v) => (
                <button
                  key={v.verse}
                  type="button"
                  disabled={readOnly || disabled || pickPhase === "ready"}
                  onClick={() => handleVerseClick(v.verse)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left font-serif text-sm leading-relaxed text-foreground/90 transition-colors",
                    verseHighlighted(v.verse) && "bg-sky-100/80 ring-1 ring-sky-300/50 dark:bg-sky-950/40 dark:ring-sky-800/50",
                    !readOnly && !disabled && pickPhase !== "ready" && "cursor-pointer hover:bg-muted/60",
                    (readOnly || disabled || pickPhase === "ready") && "cursor-default opacity-90"
                  )}
                >
                  <span className="mr-2 inline-block min-w-[1.5rem] tabular-nums text-xs text-muted-foreground">
                    {v.verse}
                  </span>
                  {v.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Load a passage above to select verses for this observation.
        </p>
      )}

      {pickPhase === "picked_first" && firstVerse != null ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Tap the end verse, or tap verse{" "}
          <span className="font-semibold text-foreground">{firstVerse}</span> again for a single verse.
        </p>
      ) : null}

      {pickPhase === "ready" && selectionRefShort ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/15 px-3 py-3">
          <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Selected: {selectionRefShort}</p>
          <div>
            <p className={meetingYourLabel}>Your observation</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What do you notice from this part of the text?"
              rows={3}
              disabled={readOnly || disabled}
              className={meetingTextareaClass("mt-1")}
            />
          </div>
        </div>
      ) : null}

      {initialRow && (savedNote || savedVn != null) && pickPhase !== "ready" ? (
        <div className="mt-6 rounded-lg border border-border/70 bg-card/50 px-3 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Saved observation
          </p>
          {savedRefShort ? (
            <p className="mt-1 text-xs font-semibold text-sky-800 dark:text-sky-200">{savedRefShort}</p>
          ) : null}
          {savedNote ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{savedNote}</p>
          ) : savedVn != null ? (
            <p className="mt-1 text-xs text-muted-foreground">(No note text saved for this prompt.)</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

SoloDbsObservationField.displayName = "SoloDbsObservationField";
