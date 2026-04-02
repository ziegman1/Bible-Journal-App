"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedMeetingPersist } from "@/hooks/use-debounced-meeting-persist";
import { MeetingPersistHint } from "@/components/groups/meeting-persist-hint";
import { assignStoryReteller, savePassageObservation } from "@/app/actions/meetings";
import {
  meetingLiveBody,
  meetingLiveEmpty,
  meetingLiveLabel,
  meetingLiveName,
  meetingLiveRegion,
  meetingLiveRow,
  meetingSectionPadding,
  meetingTextareaClass,
  meetingYourLabel,
} from "@/components/groups/meeting-input-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import type { ParticipantLookUpStep } from "@/lib/groups/meeting-presenter-state";
import type { PassageObservationRow } from "@/hooks/use-meeting-responses-realtime";
import {
  displayNameForMeetingUser,
  normalizeMeetingUserId,
} from "@/lib/groups/member-display-name";
import { formatObservationVerseRefShort } from "@/lib/groups/observation-verse-ref";
import { fetchPassageVersesRangeInBrowser } from "@/lib/scripture/fetch-passage-verses-browser";

type LookUpStep = ParticipantLookUpStep;

type ObservationType =
  | "like"
  | "difficult"
  | "teaches_about_people"
  | "teaches_about_god";

function PresenterFollowHint() {
  return (
    <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Following facilitator.</span>{" "}
      This step advances on the Facilitator / TV view only. Use the{" "}
      <span className="font-medium">Look Back · Look Up · Look Forward</span> tabs
      above to review another section on your device — that won&apos;t change the
      screen everyone sees.
    </p>
  );
}

export type OthersObservationsByType = Record<
  ObservationType,
  {
    userId: string;
    displayName: string;
    text: string;
    verseRefShort?: string;
  }[]
>;

export interface LookUpPresenterSync {
  step: LookUpStep;
  readChunkIndex: number;
  rereadChunkIndex: number;
  readChunks: { verse: number; text: string }[][];
  rereadChunks: { verse: number; text: string }[][];
  onAdvance: () => void;
  onBack: () => void;
  disabled?: boolean;
  /**
   * Participant devices: follow facilitator’s presenter state but hide Next/Back
   * (only Facilitator / TV advances the shared slides).
   */
  followOnly?: boolean;
}

interface LookUpSectionProps {
  meetingId: string;
  currentUserId: string;
  passageVerses: { verse: number; text: string }[];
  passageRef: string | null;
  /** Anchor verse for stored observations (meeting passage). */
  observationAnchor: {
    book: string;
    chapter: number;
    verseNumber: number;
  } | null;
  passageObservations: PassageObservationRow[];
  othersObservationsByType: OthersObservationsByType;
  facilitator?: string;
  reteller?: string;
  participants: { user_id: string; display_name: string }[];
  /** Full group name map from meeting detail (preferred for labels). */
  memberDisplayNames?: Record<string, string>;
  readOnly?: boolean;
  /** After the final Look Up prompt, switch the stepper to Look Forward */
  onGoToLookForward: () => void;
  /** When set, step / passage chunks follow shared presenter state */
  presenterSync?: LookUpPresenterSync;
  /**
   * When SSR sent no verses, client can load this range from Supabase (same as Read tab).
   */
  scriptureLoadHint?: {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
  } | null;
}

type VersePickPhase = "idle" | "picked_first" | "ready";

function ObservationPromptField({
  meetingId,
  observationType,
  anchor,
  readOnly,
  disabled,
  passageObservations,
  currentUserId,
  participants,
  memberDisplayNames,
  others,
  passageRef,
  passageVerses,
}: {
  meetingId: string;
  observationType: ObservationType;
  anchor: { book: string; chapter: number; verseNumber: number } | null;
  readOnly: boolean;
  disabled: boolean;
  passageObservations: PassageObservationRow[];
  currentUserId: string;
  participants: { user_id: string; display_name: string }[];
  memberDisplayNames?: Record<string, string>;
  others: {
    userId: string;
    displayName: string;
    text: string;
    verseRefShort?: string;
  }[];
  passageRef: string | null;
  passageVerses: { verse: number; text: string }[];
}) {
  const selfName = (() => {
    const n = displayNameForMeetingUser(
      currentUserId,
      memberDisplayNames ?? {},
      participants
    );
    return n === "Member" ? "You" : n;
  })();

  const verseNums = useMemo(
    () => passageVerses.map((v) => v.verse).sort((a, b) => a - b),
    [passageVerses]
  );
  const verseMin = verseNums[0] ?? 1;
  const verseMax = verseNums[verseNums.length - 1] ?? verseMin;
  const passageRefTrimmed = (passageRef ?? "").trim();
  const hasPassageRef = passageRefTrimmed.length > 0;
  const hasPassageText = hasPassageRef && passageVerses.length > 0;

  const viewerNorm =
    normalizeMeetingUserId(currentUserId) ?? currentUserId;
  const selfObservation = useMemo(
    () =>
      passageObservations.find((o) => {
        const ou = normalizeMeetingUserId(o.user_id) ?? o.user_id;
        return ou === viewerNorm && o.observation_type === observationType;
      }),
    [passageObservations, viewerNorm, observationType]
  );

  const [pickPhase, setPickPhase] = useState<VersePickPhase>("idle");
  const [firstVerse, setFirstVerse] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [observationTypeSnap, setObservationTypeSnap] =
    useState(observationType);
  if (observationType !== observationTypeSnap) {
    setObservationTypeSnap(observationType);
    setPickPhase("idle");
    setFirstVerse(null);
    setRangeEnd(null);
    setNote("");
  }

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

  const commitObservation = useCallback(async (): Promise<{ error?: string }> => {
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
    return savePassageObservation(meetingId, {
      observationType,
      book: anchor.book,
      chapter: anchor.chapter,
      verseNumber: vS,
      verseEnd: vE !== vS ? vE : null,
      note: trimmed,
    });
  }, [
    anchor,
    hasPassageText,
    pickPhase,
    firstVerse,
    rangeEnd,
    note,
    verseMin,
    verseMax,
    meetingId,
    observationType,
  ]);

  async function handleSave() {
    setSaving(true);
    const r = await commitObservation();
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Observation saved");
    handleClearSelection();
  }

  const trimmedNote = note.trim();
  const obsReady =
    pickPhase === "ready" &&
    firstVerse != null &&
    rangeEnd != null &&
    trimmedNote.length > 0;
  const draftVs = obsReady ? Math.min(firstVerse, rangeEnd) : null;
  const draftVe = obsReady ? Math.max(firstVerse, rangeEnd) : null;
  const obsDirtyKey = JSON.stringify({
    observationType,
    obsReady,
    draftVs,
    draftVe,
    n: trimmedNote,
  });
  const savedObsKey =
    selfObservation != null && selfObservation.verse_number != null
      ? JSON.stringify({
          observationType,
          obsReady: true,
          draftVs: selfObservation.verse_number,
          draftVe:
            selfObservation.verse_end != null
              ? selfObservation.verse_end
              : selfObservation.verse_number,
          n: (selfObservation.note ?? "").trim(),
        })
      : "";
  const skipObsAutosave =
    readOnly ||
    disabled ||
    !obsReady ||
    !anchor ||
    !hasPassageText ||
    obsDirtyKey === savedObsKey ||
    draftVs == null ||
    draftVe == null ||
    draftVs < verseMin ||
    draftVe > verseMax;

  const persistObservation = useCallback(async () => {
    return commitObservation();
  }, [commitObservation]);

  const observationPersistStatus = useDebouncedMeetingPersist({
    debounceMs: 1600,
    dirtyKey: obsDirtyKey,
    skip: skipObsAutosave,
    persist: persistObservation,
  });

  const selectionRefShort =
    pickPhase === "ready" && selStart != null && selEnd != null
      ? formatObservationVerseRefShort(
          selStart,
          selEnd !== selStart ? selEnd : null
        )
      : null;

  const savedNote = (selfObservation?.note ?? "").trim();
  const savedVn = selfObservation?.verse_number;
  const savedVe = selfObservation?.verse_end;
  const savedRefShort =
    savedVn != null
      ? formatObservationVerseRefShort(
          savedVn,
          savedVe != null && savedVe !== savedVn ? savedVe : null
        )
      : null;

  return (
    <div className="mt-8 border-t border-[#e8e4df] pt-8">
      <p className="text-sm leading-snug text-muted-foreground">
        Select the verse or verses that answer this question.
      </p>

      {hasPassageRef ? (
        <div className="mt-3 rounded-lg border border-[#e8e4df] bg-[#fafaf9]/70 shadow-sm">
          <p className="border-b border-[#e8e4df] px-3 py-2 text-xs font-medium text-[#1c252e]">
            {passageRefTrimmed}
          </p>
          <div className="max-h-60 overflow-y-auto px-2 py-2 sm:max-h-72">
            {hasPassageText ? (
              <div className="space-y-0.5">
                {passageVerses.map((v) => (
                  <button
                    key={v.verse}
                    type="button"
                    disabled={
                      readOnly || disabled || pickPhase === "ready"
                    }
                    onClick={() => handleVerseClick(v.verse)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left font-serif text-sm leading-relaxed text-[#1c252e]/90 transition-colors",
                      verseHighlighted(v.verse) &&
                        "bg-[#e3eef8] ring-1 ring-[#83b0da]/45",
                      !readOnly &&
                        !disabled &&
                        pickPhase !== "ready" &&
                        "hover:bg-muted/60 cursor-pointer",
                      (readOnly || disabled || pickPhase === "ready") &&
                        "cursor-default opacity-90"
                    )}
                  >
                    <span className="mr-2 inline-block min-w-[1.5rem] tabular-nums text-xs text-muted-foreground">
                      {v.verse}
                    </span>
                    {v.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-2 py-3 text-sm leading-snug text-muted-foreground">
                Verse text isn&apos;t available in the app for this reference.
                Use a printed Bible or the Facilitator / TV view to read
                together.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {pickPhase === "picked_first" && firstVerse != null ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Tap the end verse, or tap verse <span className="font-semibold text-foreground">{firstVerse}</span> again for a single verse.
        </p>
      ) : null}

      {pickPhase === "ready" && selectionRefShort ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/15 px-3 py-3">
          <p className="text-xs font-medium text-[#83b0da]">
            Selected: {selectionRefShort}
          </p>
          <div>
            <p className={meetingYourLabel}>
              Share your observation
              <span className="sr-only"> ({selfName})</span>
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What do you notice from this part of the text?"
              rows={3}
              disabled={readOnly || disabled}
              className={meetingTextareaClass("mt-1")}
            />
          </div>
          {!readOnly ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || saving || !anchor || !note.trim()}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Save for group
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || saving}
                onClick={handleClearSelection}
              >
                Clear selection
              </Button>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground leading-snug">
            Auto-saves about 2s after you stop typing when a verse range and note are ready,
            or tap Save for group.
          </p>
          <MeetingPersistHint status={observationPersistStatus} />
        </div>
      ) : null}

      {(savedNote || savedVn != null) && (
        <div className="mt-6 rounded-lg border border-border/70 bg-card/50 px-3 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Your saved observation
          </p>
          {savedRefShort ? (
            <p className="mt-1 text-xs font-semibold text-[#83b0da]">
              {savedRefShort}
            </p>
          ) : null}
          {savedNote ? (
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
              {savedNote}
            </p>
          ) : savedVn != null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              (No note text saved for this prompt.)
            </p>
          ) : null}
        </div>
      )}

      <div className={cn(meetingLiveRegion, "mt-6")}>
        <p className={meetingLiveLabel}>Group (live)</p>
        {others.length === 0 ? (
          <p className={meetingLiveEmpty}>No one else has shared yet.</p>
        ) : (
          <ul className="m-0 list-none space-y-0 p-0">
            {others.map((o) => (
              <li key={o.userId} className={meetingLiveRow}>
                <p className={meetingLiveName}>{o.displayName}</p>
                {o.verseRefShort ? (
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#83b0da]">
                    {o.verseRefShort}
                  </p>
                ) : null}
                <p className={meetingLiveBody}>{o.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!anchor && !readOnly ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add a story or passage to this meeting to save written observations.
        </p>
      ) : null}
    </div>
  );
}

function PassageVersesBlock({
  passageRef,
  passageVerses,
}: {
  passageRef: string;
  passageVerses: { verse: number; text: string }[];
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-[#fafaf9]/40",
        meetingSectionPadding
      )}
    >
      <h3 className="text-base font-semibold text-[#1c252e]">{passageRef}</h3>
      <div className="font-serif text-[#1c252e]/90 leading-relaxed space-y-1">
        {passageVerses.map((v) => (
          <p key={v.verse} className="py-1.5">
            <span className="text-muted-foreground/70 text-sm mr-2">
              {v.verse}
            </span>
            {v.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function LookUpSection({
  meetingId,
  currentUserId,
  passageVerses,
  passageRef,
  observationAnchor,
  passageObservations,
  othersObservationsByType,
  facilitator,
  reteller,
  participants,
  memberDisplayNames = {},
  readOnly = false,
  onGoToLookForward,
  presenterSync,
  scriptureLoadHint = null,
}: LookUpSectionProps) {
  const [localStep, setLocalStep] = useState<LookUpStep>("read");
  const [clientPassageVerses, setClientPassageVerses] = useState<
    { verse: number; text: string }[]
  >([]);
  const [meetingIdSnap, setMeetingIdSnap] = useState(meetingId);
  if (meetingId !== meetingIdSnap) {
    setMeetingIdSnap(meetingId);
    setClientPassageVerses([]);
  }

  useEffect(() => {
    if (passageVerses.length > 0 || !scriptureLoadHint) return;
    let cancelled = false;
    void fetchPassageVersesRangeInBrowser(scriptureLoadHint).then((rows) => {
      if (!cancelled && rows.length > 0) setClientPassageVerses(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, passageVerses.length, scriptureLoadHint]);

  const versesMerged =
    passageVerses.length > 0 ? passageVerses : clientPassageVerses;

  const step = presenterSync?.step ?? localStep;
  const hasPassage = Boolean(
    (passageRef && passageRef.trim().length > 0) && versesMerged.length > 0
  );
  const readVersesForChunk =
    presenterSync && presenterSync.readChunks.length > 0
      ? presenterSync.readChunks[
          Math.min(
            presenterSync.readChunkIndex,
            presenterSync.readChunks.length - 1
          )
        ] ?? []
      : versesMerged;

  const rereadVersesForChunk =
    presenterSync && presenterSync.rereadChunks.length > 0
      ? presenterSync.rereadChunks[
          Math.min(
            presenterSync.rereadChunkIndex,
            presenterSync.rereadChunks.length - 1
          )
        ] ?? []
      : versesMerged;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  async function handleAssignReteller() {
    if (participants.length === 0) return;
    const idx = Math.floor(Math.random() * participants.length);
    const r = await assignStoryReteller(
      meetingId,
      participants[idx].user_id,
      "random"
    );
    if (r.error) toast.error(r.error);
    else {
      const who = displayNameForMeetingUser(
        participants[idx].user_id,
        memberDisplayNames,
        participants
      );
      toast.success(`Assigned ${who} to retell`);
      window.location.reload();
    }
  }

  const dis = (presenterSync?.disabled ?? false) || readOnly;
  /** Shared presenter nav (Facilitator / TV only — not participant follow mode). */
  const psNav = Boolean(presenterSync && !presenterSync.followOnly);

  if (step === "retell") {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Retell
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Retell the story in your own words as best you can. Have the rest of
            the group fill in any areas that were left out.
          </p>
          {reteller ? (
            <p className="text-sm text-muted-foreground">
              Retelling: <span className="font-medium">{reteller}</span>
            </p>
          ) : (
            participants.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssignReteller}
                disabled={dis}
              >
                <Shuffle className="size-4 mr-2" />
                Randomly assign reteller
              </Button>
            )
          )}
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back to passage
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => setLocalStep("like")}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => setLocalStep("read")}
              >
                ← Back to passage
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "like") {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Discuss
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-[#1c252e]">
                What did you like about the story?
              </span>
            </p>
            <p>
              <span className="font-medium text-[#1c252e]">
                Was there any part that really stood out to you?
              </span>
            </p>
          </div>
          <ObservationPromptField
            meetingId={meetingId}
            observationType="like"
            anchor={observationAnchor}
            readOnly={readOnly}
            disabled={dis}
            passageObservations={passageObservations}
            currentUserId={currentUserId}
            participants={participants}
            memberDisplayNames={memberDisplayNames}
            others={othersObservationsByType.like}
            passageRef={passageRef}
            passageVerses={versesMerged}
          />
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => setLocalStep("difficult")}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => setLocalStep("retell")}
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "difficult") {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Discuss
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-[#1c252e]">
                Was there anything difficult to understand in the story?
              </span>
            </p>
            <p>
              <span className="font-medium text-[#1c252e]">
                Anything hard to believe?
              </span>
            </p>
          </div>
          <ObservationPromptField
            meetingId={meetingId}
            observationType="difficult"
            anchor={observationAnchor}
            readOnly={readOnly}
            disabled={dis}
            passageObservations={passageObservations}
            currentUserId={currentUserId}
            participants={participants}
            memberDisplayNames={memberDisplayNames}
            others={othersObservationsByType.difficult}
            passageRef={passageRef}
            passageVerses={versesMerged}
          />
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => setLocalStep("reread_passage")}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => setLocalStep("like")}
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "reread_passage" && hasPassage) {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Read again
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Read the passage again together.
          </p>
          {presenterSync && presenterSync.rereadChunks.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              Part {presenterSync.rereadChunkIndex + 1} of{" "}
              {presenterSync.rereadChunks.length}
            </p>
          ) : null}
        </div>
        <PassageVersesBlock
          passageRef={passageRef!}
          passageVerses={rereadVersesForChunk}
        />
        {psNav ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={dis}
              onClick={() => presenterSync!.onAdvance()}
            >
              Next
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={dis}
              onClick={() => presenterSync!.onBack()}
            >
              ← Back
            </Button>
          </div>
        ) : presenterSync?.followOnly ? (
          <PresenterFollowHint />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={dis}
              onClick={() => setLocalStep("people")}
            >
              Next
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={dis}
              onClick={() => setLocalStep("difficult")}
            >
              ← Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (step === "people") {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Discuss
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-[#1c252e]">
              What does the story teach us about people, ourselves, or humanity?
            </span>
          </p>
          <ObservationPromptField
            meetingId={meetingId}
            observationType="teaches_about_people"
            anchor={observationAnchor}
            readOnly={readOnly}
            disabled={dis}
            passageObservations={passageObservations}
            currentUserId={currentUserId}
            participants={participants}
            memberDisplayNames={memberDisplayNames}
            others={othersObservationsByType.teaches_about_people}
            passageRef={passageRef}
            passageVerses={versesMerged}
          />
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => setLocalStep("god")}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() =>
                  setLocalStep(hasPassage ? "reread_passage" : "difficult")
                }
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "god") {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <h2 className="text-lg font-medium text-[#1c252e]">
            Look Up — Discuss
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-[#1c252e]">
              What does the story teach us about God?
            </span>
          </p>
          <ObservationPromptField
            meetingId={meetingId}
            observationType="teaches_about_god"
            anchor={observationAnchor}
            readOnly={readOnly}
            disabled={dis}
            passageObservations={passageObservations}
            currentUserId={currentUserId}
            participants={participants}
            memberDisplayNames={memberDisplayNames}
            others={othersObservationsByType.teaches_about_god}
            passageRef={passageRef}
            passageVerses={versesMerged}
          />
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next — Look Forward
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button disabled={dis} onClick={() => onGoToLookForward()}>
                Next — Look Forward
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => setLocalStep("people")}
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "reread_passage" && !hasPassage) {
    return (
      <div className="space-y-10">
        <div
          className={cn(
            "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
            meetingSectionPadding
          )}
        >
          <p className="text-sm text-muted-foreground">
            Passage text isn&apos;t available here. Continue to the next prompts.
          </p>
          {psNav ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => presenterSync!.onBack()}
              >
                ← Back
              </Button>
            </div>
          ) : presenterSync?.followOnly ? (
            <PresenterFollowHint />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={dis}
                onClick={() => setLocalStep("people")}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={dis}
                onClick={() => setLocalStep("difficult")}
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // step === "read" (default)
  return (
    <div className="space-y-10">
      <div
        className={cn(
          "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-white",
          meetingSectionPadding
        )}
      >
        <h2 className="text-lg font-medium text-[#1c252e]">
          Look Up — Discovery Bible Study
        </h2>
        <p className="text-sm text-muted-foreground">
          Have someone read the passage out loud.
        </p>
        {facilitator && (
          <p className="text-sm text-muted-foreground">
            Facilitator: {facilitator}
          </p>
        )}
        {presenterSync && presenterSync.readChunks.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            Part {presenterSync.readChunkIndex + 1} of{" "}
            {presenterSync.readChunks.length}
          </p>
        ) : null}
      </div>

      {hasPassage && (
        <>
          <PassageVersesBlock
            passageRef={passageRef!}
            passageVerses={readVersesForChunk}
          />
          <div className="pt-2">
            {psNav ? (
              <Button
                disabled={dis}
                onClick={() => presenterSync!.onAdvance()}
              >
                Next
              </Button>
            ) : presenterSync?.followOnly ? (
              <PresenterFollowHint />
            ) : (
              <Button
                disabled={dis}
                onClick={() => setLocalStep("retell")}
              >
                Next
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
