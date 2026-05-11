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
import {
  transitionParticipantLookUpDeviceNext,
  type ParticipantLookUpStep,
} from "@/lib/groups/meeting-presenter-state";
import type { PassageObservationRow } from "@/hooks/use-meeting-responses-realtime";
import {
  displayNameForMeetingUser,
  normalizeMeetingUserId,
} from "@/lib/groups/member-display-name";
import {
  formatObservationVerseRef,
  formatObservationVerseRefShort,
} from "@/lib/groups/observation-verse-ref";
import {
  wrapChapterVersesAsLines,
  type PassageVerseLine,
} from "@/lib/groups/preset-story-passage.shared";
import { fetchPassageVersesRangeInBrowser } from "@/lib/scripture/fetch-passage-verses-browser";

type LookUpStep = ParticipantLookUpStep;

type LookUpBrowseOverride = {
  step: LookUpStep;
  readChunkIndex: number;
  rereadChunkIndex: number;
};

type ObservationType =
  | "like"
  | "difficult"
  | "teaches_about_people"
  | "teaches_about_god";

function PresenterFollowHint() {
  return (
    <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground leading-relaxed">
      <span className="font-medium text-foreground">Following facilitator.</span>{" "}
      This step advances on the Facilitator / TV view only. Use the{" "}
      <span className="font-medium">Look Back · Look Up · Look Forward</span> tabs
      above to review another section on your device — that won&apos;t change the
      screen everyone sees.
    </p>
  );
}

/** Participant view: advance Look Up sub-steps on this device only (shared slides stay on TV). */
function ParticipantFollowFooter({
  disabled,
  nextLabel,
  onDeviceNext,
}: {
  disabled: boolean;
  nextLabel: string;
  onDeviceNext: () => void;
}) {
  return (
    <div className="mt-6 space-y-3 border-t border-border/70 pt-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground">Following facilitator.</span>{" "}
        Shared slides advance on the Facilitator / TV view only. The tabs at the top
        are for your device — they won&apos;t change the screen everyone sees.
      </p>
      <Button type="button" disabled={disabled} onClick={onDeviceNext}>
        {nextLabel}
      </Button>
      <p className="text-[0.65rem] text-muted-foreground leading-snug">
        On this device only — does not advance the TV.
      </p>
    </div>
  );
}

function FollowOnlyFooter({
  participantQuickSectionNav,
  dis,
  nextLabel,
  onDeviceNext,
}: {
  participantQuickSectionNav: boolean;
  dis: boolean;
  nextLabel: string;
  onDeviceNext: () => void;
}) {
  if (participantQuickSectionNav) {
    return (
      <ParticipantFollowFooter
        disabled={dis}
        nextLabel={nextLabel}
        onDeviceNext={onDeviceNext}
      />
    );
  }
  return <PresenterFollowHint />;
}

/** One row in the shared Look Up stream (includes current user; labels distinguish You / Facilitator). */
export type GroupObservationLiveItem = {
  userId: string;
  displayName: string;
  text: string;
  verseRefShort?: string;
  isViewer: boolean;
  isFacilitator: boolean;
};

export type GroupObservationsByType = Record<
  ObservationType,
  GroupObservationLiveItem[]
>;

export interface LookUpPresenterSync {
  step: LookUpStep;
  readChunkIndex: number;
  rereadChunkIndex: number;
  readChunks: PassageVerseLine[][];
  rereadChunks: PassageVerseLine[][];
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
  passageVerses: PassageVerseLine[];
  passageRef: string | null;
  /** Explains loaded segments vs optional catalog refs (preset meetings). */
  passageLookUpCaption?: string | null;
  /** Anchor verse for stored observations (meeting passage). */
  observationAnchor: {
    book: string;
    chapter: number;
    verseNumber: number;
  } | null;
  passageObservations: PassageObservationRow[];
  groupObservationsByType: GroupObservationsByType;
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
  /**
   * When false (Facilitator / TV has commenced), follow-only mode shows the hint only — no device “Next” rail.
   */
  participantQuickSectionNav?: boolean;
}

type VersePickPhase = "idle" | "picked_first" | "ready";

function ObservationPromptField({
  meetingId,
  observationType,
  anchor: _anchor,
  readOnly,
  disabled,
  passageObservations,
  currentUserId,
  participants,
  memberDisplayNames,
  groupLive,
  passageRef,
  passageVerses,
  passageLoadCaption,
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
  groupLive: GroupObservationLiveItem[];
  passageRef: string | null;
  passageVerses: PassageVerseLine[];
  passageLoadCaption?: string | null;
}) {
  const selfName = (() => {
    const n = displayNameForMeetingUser(
      currentUserId,
      memberDisplayNames ?? {},
      participants
    );
    return n === "Member" ? "You" : n;
  })();

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
  const [firstLineIdx, setFirstLineIdx] = useState<number | null>(null);
  const [endLineIdx, setEndLineIdx] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [observationTypeSnap, setObservationTypeSnap] =
    useState(observationType);
  if (observationType !== observationTypeSnap) {
    setObservationTypeSnap(observationType);
    setPickPhase("idle");
    setFirstLineIdx(null);
    setEndLineIdx(null);
    setNote("");
  }

  const selStartIdx =
    pickPhase === "ready" && firstLineIdx != null && endLineIdx != null
      ? Math.min(firstLineIdx, endLineIdx)
      : pickPhase === "picked_first" && firstLineIdx != null
        ? firstLineIdx
        : null;
  const selEndIdx =
    pickPhase === "ready" && firstLineIdx != null && endLineIdx != null
      ? Math.max(firstLineIdx, endLineIdx)
      : pickPhase === "picked_first" && firstLineIdx != null
        ? firstLineIdx
        : null;

  function verseLineHighlighted(lineIdx: number): boolean {
    if (selStartIdx == null || selEndIdx == null) return false;
    return lineIdx >= selStartIdx && lineIdx <= selEndIdx;
  }

  function handleVerseLineClick(lineIdx: number) {
    if (readOnly || disabled || !hasPassageText) return;
    if (pickPhase === "ready") return;
    if (lineIdx < 0 || lineIdx >= passageVerses.length) return;

    if (pickPhase === "idle") {
      setFirstLineIdx(lineIdx);
      setPickPhase("picked_first");
      return;
    }
    if (pickPhase === "picked_first" && firstLineIdx != null) {
      if (lineIdx === firstLineIdx) {
        setEndLineIdx(lineIdx);
        setPickPhase("ready");
        return;
      }
      const a = passageVerses[firstLineIdx];
      const b = passageVerses[lineIdx];
      if (a.book !== b.book || a.chapter !== b.chapter) {
        toast.error(
          "Select verses within the same passage segment (one Part block)."
        );
        return;
      }
      setEndLineIdx(lineIdx);
      setPickPhase("ready");
    }
  }

  function handleClearSelection() {
    setPickPhase("idle");
    setFirstLineIdx(null);
    setEndLineIdx(null);
    setNote("");
  }

  const commitObservation = useCallback(async (): Promise<{ error?: string }> => {
    if (!hasPassageText) {
      return { error: "Passage text isn’t available for this reference." };
    }
    if (
      pickPhase !== "ready" ||
      firstLineIdx == null ||
      endLineIdx == null
    ) {
      return { error: "Select a verse range first." };
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return { error: "Write your observation before saving." };
    }
    const lo = Math.min(firstLineIdx, endLineIdx);
    const hi = Math.max(firstLineIdx, endLineIdx);
    const slice = passageVerses.slice(lo, hi + 1);
    const book = slice[0].book;
    const chapter = slice[0].chapter;
    const vS = Math.min(...slice.map((l) => l.verse));
    const vE = Math.max(...slice.map((l) => l.verse));
    return savePassageObservation(meetingId, {
      observationType,
      book,
      chapter,
      verseNumber: vS,
      verseEnd: vE !== vS ? vE : null,
      note: trimmed,
    });
  }, [
    hasPassageText,
    pickPhase,
    firstLineIdx,
    endLineIdx,
    note,
    passageVerses,
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
    firstLineIdx != null &&
    endLineIdx != null &&
    trimmedNote.length > 0;
  const draftLo = obsReady ? Math.min(firstLineIdx, endLineIdx) : null;
  const draftBook = draftLo != null ? passageVerses[draftLo]?.book : null;
  const draftChapter = draftLo != null ? passageVerses[draftLo]?.chapter : null;
  const draftVs =
    obsReady && firstLineIdx != null && endLineIdx != null
      ? Math.min(
          passageVerses[firstLineIdx].verse,
          passageVerses[endLineIdx].verse
        )
      : null;
  const draftVe =
    obsReady && firstLineIdx != null && endLineIdx != null
      ? Math.max(
          passageVerses[firstLineIdx].verse,
          passageVerses[endLineIdx].verse
        )
      : null;
  const obsDirtyKey = JSON.stringify({
    observationType,
    obsReady,
    bk: draftBook,
    ch: draftChapter,
    draftVs,
    draftVe,
    n: trimmedNote,
  });
  const savedObsKey =
    selfObservation != null && selfObservation.verse_number != null
      ? JSON.stringify({
          observationType,
          obsReady: true,
          bk: selfObservation.book,
          ch: selfObservation.chapter,
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
    !hasPassageText ||
    obsDirtyKey === savedObsKey ||
    draftVs == null ||
    draftVe == null ||
    draftBook == null ||
    draftChapter == null;

  const persistObservation = useCallback(async () => {
    return commitObservation();
  }, [commitObservation]);

  const observationPersistStatus = useDebouncedMeetingPersist({
    debounceMs: 1600,
    dirtyKey: obsDirtyKey,
    skip: skipObsAutosave,
    persist: persistObservation,
  });

  const selectionRefLabel =
    pickPhase === "ready" &&
    firstLineIdx != null &&
    endLineIdx != null
      ? formatObservationVerseRef({
          book: passageVerses[Math.min(firstLineIdx, endLineIdx)].book,
          chapter: passageVerses[Math.min(firstLineIdx, endLineIdx)].chapter,
          verseStart: Math.min(
            passageVerses[firstLineIdx].verse,
            passageVerses[endLineIdx].verse
          ),
          verseEnd: (() => {
            const x = passageVerses[firstLineIdx].verse;
            const y = passageVerses[endLineIdx].verse;
            const lo = Math.min(x, y);
            const hi = Math.max(x, y);
            return hi !== lo ? hi : null;
          })(),
        })
      : null;

  return (
    <div className="mt-8 min-w-0 max-w-full border-t border-[#e8e4df] pt-8">
      <p className="text-sm leading-snug text-muted-foreground">
        Select the verse or verses that answer this question.
      </p>

      {hasPassageRef ? (
        <div className="mt-3 min-w-0 max-w-full rounded-lg border border-[#e8e4df] bg-[#fafaf9]/70 shadow-sm">
          <p className="border-b border-[#e8e4df] px-3 py-2 text-xs font-medium text-[#1c252e]">
            {passageRefTrimmed}
          </p>
          {passageLoadCaption ? (
            <p className="border-b border-[#e8e4df] px-3 py-2 text-[0.65rem] leading-snug text-muted-foreground">
              {passageLoadCaption}
            </p>
          ) : null}
          <div className="max-h-60 min-w-0 overflow-y-auto overflow-x-hidden px-2 py-2 sm:max-h-72">
            {hasPassageText ? (
              <div className="space-y-0.5">
                {passageVerses.map((line, lineIdx) => (
                  <div key={line.lineId} className="min-w-0">
                    {line.segmentHeadingBefore ? (
                      <p className="px-2 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground border-t border-[#e8e4df]/80 first:border-t-0 first:pt-0">
                        {line.segmentHeadingBefore}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={
                        readOnly || disabled || pickPhase === "ready"
                      }
                      onClick={() => handleVerseLineClick(lineIdx)}
                      className={cn(
                        "w-full min-w-0 max-w-full break-words rounded-md px-2 py-1.5 text-left font-serif text-sm leading-relaxed text-[#1c252e]/90 transition-colors",
                        verseLineHighlighted(lineIdx) &&
                          "bg-[#e3eef8] ring-1 ring-[#83b0da]/45",
                        !readOnly &&
                          !disabled &&
                          pickPhase !== "ready" &&
                          "hover:bg-muted/60 cursor-pointer",
                        (readOnly || disabled || pickPhase === "ready") &&
                          "cursor-default opacity-90"
                      )}
                    >
                      <span className="mr-2 inline-block min-w-[2.75rem] tabular-nums text-xs text-muted-foreground">
                        {line.verseDisplayLabel}
                      </span>
                      {line.text}
                    </button>
                  </div>
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

      {pickPhase === "picked_first" && firstLineIdx != null ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Tap the end line, or tap{" "}
          <span className="font-semibold text-foreground">
            {passageVerses[firstLineIdx]?.verseDisplayLabel}
          </span>{" "}
          again for a single verse. Stay within the same Part segment.
        </p>
      ) : null}

      {pickPhase === "ready" && selectionRefLabel ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/15 px-3 py-3">
          <p className="text-xs font-medium text-[#83b0da]">
            Selected: {selectionRefLabel}
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
                disabled={
                  disabled || saving || !passageVerses.length || !note.trim()
                }
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

      <div className={cn(meetingLiveRegion, "mt-6")}>
        <p className={meetingLiveLabel}>Group (live)</p>
        {groupLive.length === 0 ? (
          <p className={meetingLiveEmpty}>No one has shared yet.</p>
        ) : (
          <ul className="m-0 min-w-0 list-none space-y-0 p-0">
            {groupLive.map((o) => (
              <li
                key={o.userId}
                className={cn(
                  meetingLiveRow,
                  "max-w-full",
                  o.isViewer &&
                    "rounded-lg border border-[#83b0da]/30 bg-[#83b0da]/[0.07] px-3 py-3 sm:px-4"
                )}
              >
                <p className={cn(meetingLiveName, "flex flex-wrap items-center gap-x-2 gap-y-1")}>
                  <span>{o.displayName}</span>
                  {o.isViewer ? (
                    <span className="inline-flex items-center rounded-full border border-[#83b0da]/40 bg-[#83b0da]/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-[#4a7aa8]">
                      You
                    </span>
                  ) : null}
                  {o.isFacilitator ? (
                    <span className="inline-flex items-center rounded-full border border-[#edb73e]/45 bg-[#edb73e]/12 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-[#a67c1f]">
                      Facilitator
                    </span>
                  ) : null}
                </p>
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

      {!hasPassageRef && !readOnly ? (
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
  loadCaption,
}: {
  passageRef: string;
  passageVerses: PassageVerseLine[];
  loadCaption?: string | null;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#d8d4d0] border-l-4 border-l-[#1c252e] bg-[#fafaf9]/40",
        meetingSectionPadding
      )}
    >
      <h3 className="break-words text-base font-semibold text-[#1c252e]">
        {passageRef}
      </h3>
      {loadCaption ? (
        <p className="mt-2 text-xs leading-snug text-muted-foreground whitespace-pre-wrap">
          {loadCaption}
        </p>
      ) : null}
      <div className="min-w-0 space-y-1 font-serif leading-relaxed text-[#1c252e]/90 mt-3">
        {passageVerses.map((line) => (
          <div key={line.lineId} className="min-w-0">
            {line.segmentHeadingBefore ? (
              <p className="py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground border-t border-[#d8d4d0]/80 first:border-t-0 first:pt-0">
                {line.segmentHeadingBefore}
              </p>
            ) : null}
            <p className="break-words py-1.5">
              <span className="text-muted-foreground/70 text-sm mr-2 tabular-nums">
                {line.verseDisplayLabel}
              </span>
              {line.text}
            </p>
          </div>
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
  passageLookUpCaption = null,
  observationAnchor,
  passageObservations,
  groupObservationsByType,
  facilitator,
  reteller,
  participants,
  memberDisplayNames = {},
  readOnly = false,
  onGoToLookForward,
  presenterSync,
  scriptureLoadHint = null,
  participantQuickSectionNav = true,
}: LookUpSectionProps) {
  const [localStep, setLocalStep] = useState<LookUpStep>("read");
  const [browseOverride, setBrowseOverride] =
    useState<LookUpBrowseOverride | null>(null);
  const [clientPassageVerses, setClientPassageVerses] = useState<
    PassageVerseLine[]
  >([]);
  const [meetingIdSnap, setMeetingIdSnap] = useState(meetingId);
  if (meetingId !== meetingIdSnap) {
    setMeetingIdSnap(meetingId);
    setClientPassageVerses([]);
    setBrowseOverride(null);
  }

  useEffect(() => {
    if (passageVerses.length > 0 || !scriptureLoadHint) return;
    let cancelled = false;
    void fetchPassageVersesRangeInBrowser(scriptureLoadHint).then((rows) => {
      if (!cancelled && rows.length > 0)
        setClientPassageVerses(
          wrapChapterVersesAsLines(
            scriptureLoadHint.book,
            scriptureLoadHint.chapter,
            rows
          )
        );
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, passageVerses.length, scriptureLoadHint]);

  const versesMerged =
    passageVerses.length > 0 ? passageVerses : clientPassageVerses;

  const baseStep = (presenterSync?.step ?? localStep) as LookUpStep;
  const baseReadIdx = presenterSync?.readChunkIndex ?? 0;
  const baseRereadIdx = presenterSync?.rereadChunkIndex ?? 0;
  const followBrowse = Boolean(
    presenterSync?.followOnly && participantQuickSectionNav
  );

  const effectiveStep: LookUpStep = followBrowse
    ? (browseOverride?.step ?? baseStep)
    : baseStep;
  const effectiveReadChunkIndex = followBrowse
    ? (browseOverride?.readChunkIndex ?? baseReadIdx)
    : baseReadIdx;
  const effectiveRereadChunkIndex = followBrowse
    ? (browseOverride?.rereadChunkIndex ?? baseRereadIdx)
    : baseRereadIdx;

  const hasPassage = Boolean(
    (passageRef && passageRef.trim().length > 0) && versesMerged.length > 0
  );
  const dis = (presenterSync?.disabled ?? false) || readOnly;

  const readChunkIdxForDisplay = (() => {
    if (!presenterSync || presenterSync.readChunks.length === 0) return 0;
    const max = presenterSync.readChunks.length - 1;
    const idx = followBrowse ? effectiveReadChunkIndex : presenterSync.readChunkIndex;
    return Math.min(Math.max(0, idx), max);
  })();

  const readVersesForChunk =
    presenterSync && presenterSync.readChunks.length > 0
      ? presenterSync.readChunks[readChunkIdxForDisplay] ?? []
      : versesMerged;

  const rereadChunkIdxForDisplay = (() => {
    if (!presenterSync || presenterSync.rereadChunks.length === 0) return 0;
    const max = presenterSync.rereadChunks.length - 1;
    const idx = followBrowse
      ? effectiveRereadChunkIndex
      : presenterSync.rereadChunkIndex;
    return Math.min(Math.max(0, idx), max);
  })();

  const rereadVersesForChunk =
    presenterSync && presenterSync.rereadChunks.length > 0
      ? presenterSync.rereadChunks[rereadChunkIdxForDisplay] ?? []
      : versesMerged;

  const transitionCtx = useMemo(
    () => ({
      hasPassage,
      readChunkCount: presenterSync?.readChunks.length ?? 0,
      rereadChunkCount: presenterSync?.rereadChunks.length ?? 0,
      practiceSlideCount: 1,
    }),
    [
      hasPassage,
      presenterSync?.readChunks.length,
      presenterSync?.rereadChunks.length,
    ]
  );

  const deviceNextResult = useMemo(() => {
    if (!followBrowse || !presenterSync) return null;
    return transitionParticipantLookUpDeviceNext(
      effectiveStep,
      effectiveReadChunkIndex,
      effectiveRereadChunkIndex,
      transitionCtx
    );
  }, [
    followBrowse,
    presenterSync,
    effectiveStep,
    effectiveReadChunkIndex,
    effectiveRereadChunkIndex,
    transitionCtx,
  ]);

  const deviceNextLabel =
    deviceNextResult?.kind === "look_forward" ? "Next — Look Forward" : "Next";

  const handleDeviceNext = useCallback(() => {
    if (!deviceNextResult || (presenterSync?.disabled ?? false) || readOnly)
      return;
    if (deviceNextResult.kind === "look_forward") {
      setBrowseOverride(null);
      onGoToLookForward();
      return;
    }
    setBrowseOverride({
      step: deviceNextResult.step,
      readChunkIndex: deviceNextResult.readChunkIndex,
      rereadChunkIndex: deviceNextResult.rereadChunkIndex,
    });
  }, [
    deviceNextResult,
    readOnly,
    presenterSync?.disabled,
    onGoToLookForward,
  ]);

  const presenterLookUpKey = presenterSync
    ? `${presenterSync.step}-${presenterSync.readChunkIndex}-${presenterSync.rereadChunkIndex}`
    : "";

  useEffect(() => {
    if (!presenterSync?.followOnly || !participantQuickSectionNav) {
      setBrowseOverride(null);
      return;
    }
    setBrowseOverride(null);
  }, [presenterLookUpKey, presenterSync?.followOnly, participantQuickSectionNav]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [effectiveStep, readChunkIdxForDisplay, rereadChunkIdxForDisplay]);

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

  /** Shared presenter nav (Facilitator / TV only — not participant follow mode). */
  const psNav = Boolean(presenterSync && !presenterSync.followOnly);

  if (effectiveStep === "retell") {
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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

  if (effectiveStep === "like") {
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
            groupLive={groupObservationsByType.like}
            passageRef={passageRef}
            passageVerses={versesMerged}
            passageLoadCaption={passageLookUpCaption}
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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

  if (effectiveStep === "difficult") {
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
            groupLive={groupObservationsByType.difficult}
            passageRef={passageRef}
            passageVerses={versesMerged}
            passageLoadCaption={passageLookUpCaption}
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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

  if (effectiveStep === "reread_passage" && hasPassage) {
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
              Part {rereadChunkIdxForDisplay + 1} of{" "}
              {presenterSync.rereadChunks.length}
            </p>
          ) : null}
        </div>
        <PassageVersesBlock
          passageRef={passageRef!}
          passageVerses={rereadVersesForChunk}
          loadCaption={passageLookUpCaption}
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
          <FollowOnlyFooter
            participantQuickSectionNav={participantQuickSectionNav}
            dis={dis || deviceNextResult == null}
            nextLabel={deviceNextLabel}
            onDeviceNext={handleDeviceNext}
          />
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

  if (effectiveStep === "people") {
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
            groupLive={groupObservationsByType.teaches_about_people}
            passageRef={passageRef}
            passageVerses={versesMerged}
            passageLoadCaption={passageLookUpCaption}
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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

  if (effectiveStep === "god") {
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
            groupLive={groupObservationsByType.teaches_about_god}
            passageRef={passageRef}
            passageVerses={versesMerged}
            passageLoadCaption={passageLookUpCaption}
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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

  if (effectiveStep === "reread_passage" && !hasPassage) {
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
            <FollowOnlyFooter
              participantQuickSectionNav={participantQuickSectionNav}
              dis={dis || deviceNextResult == null}
              nextLabel={deviceNextLabel}
              onDeviceNext={handleDeviceNext}
            />
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
            Part {readChunkIdxForDisplay + 1} of{" "}
            {presenterSync.readChunks.length}
          </p>
        ) : null}
      </div>

      {hasPassage && (
        <>
          <PassageVersesBlock
            passageRef={passageRef!}
            passageVerses={readVersesForChunk}
            loadCaption={passageLookUpCaption}
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
              <FollowOnlyFooter
                participantQuickSectionNav={participantQuickSectionNav}
                dis={dis || deviceNextResult == null}
                nextLabel={deviceNextLabel}
                onDeviceNext={handleDeviceNext}
              />
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

      {!hasPassage && presenterSync?.followOnly ? (
        <FollowOnlyFooter
          participantQuickSectionNav={participantQuickSectionNav}
          dis={dis || deviceNextResult == null}
          nextLabel={deviceNextLabel}
          onDeviceNext={handleDeviceNext}
        />
      ) : null}
    </div>
  );
}
