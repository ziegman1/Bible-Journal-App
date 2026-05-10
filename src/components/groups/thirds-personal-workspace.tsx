"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  saveThirdsPersonalLookBack,
  saveThirdsPersonalLookBackJournal,
  saveThirdsPersonalLookForward,
  saveThirdsPersonalLookUp,
  setThirdsSoloLookUpPreference,
} from "@/app/actions/thirds-personal";
import type {
  SoloLookUpMode,
  ThirdsPersonalDbsObservationDTO,
  ThirdsPersonalDbsObservationType,
  ThirdsPersonalWeekDTO,
  ThirdsPersonalWorkspacePayload,
} from "@/lib/groups/thirds-personal-types";
import { ThirdsPersonalDbsLookUp } from "@/components/groups/thirds-personal-dbs-look-up";
import { SOLO_DISCOVERY_QUESTIONS } from "@/lib/groups/solo-discovery-prompts";
import { formatObservationVerseRef } from "@/lib/groups/observation-verse-ref";
import {
  meetingSectionPadding,
  meetingTextareaClass,
  meetingYourLabel,
  meetingYourRegion,
} from "@/components/groups/meeting-input-layout";
import { LookBackVisionEncouragement } from "@/components/groups/look-back-vision-encouragement";
import {
  LookBackSubstepIndicator,
  ThirdsRhythmStepper,
  type ThirdsRhythmSection,
} from "@/components/groups/three-thirds-stepper";
import type { LookBackSubstep } from "@/lib/groups/meeting-presenter-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatParticipationWeekLong } from "@/lib/groups/participation-week-display";
import {
  buildSuggestedLookForward,
  effectiveThirdsPersonalPassageRef,
} from "@/lib/groups/thirds-personal-helpers";
import {
  dbsObservationListDiscoveryComplete,
  validateDbsVerseInPassage,
} from "@/lib/groups/thirds-personal-dbs-validate";
import { saveThirdsState } from "@/lib/guest/thirds-personal-guest-persistence";
import {
  parseSoloScriptureReference,
  SOLO_SCRIPTURE_REF_HINT,
} from "@/lib/groups/solo-scripture-reference-parse";
import { fetchPassageVersesRangeInBrowser } from "@/lib/scripture/fetch-passage-verses-browser";
import { cn } from "@/lib/utils";
import { Check, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SOLO_TOP_LABELS: Record<ThirdsRhythmSection, string> = {
  1: "Look Back",
  2: "Look Up",
  3: "Look Forward",
};

const LOOK_BACK_SUB_LABELS: Record<LookBackSubstep, string> = {
  1: "Share & Care",
  2: "Checking In",
  3: "Vision",
};

type SoloReturnSnapshot =
  | { top: 1; lookBackSubstep: LookBackSubstep }
  | { top: 2 }
  | { top: 3 };

function soloReturnLabel(r: SoloReturnSnapshot): string {
  if (r.top === 1) return `${SOLO_TOP_LABELS[1]} · ${LOOK_BACK_SUB_LABELS[r.lookBackSubstep]}`;
  return SOLO_TOP_LABELS[r.top];
}

function atSoloReturnSnapshot(
  r: SoloReturnSnapshot,
  top: ThirdsRhythmSection,
  sub: LookBackSubstep
): boolean {
  if (r.top !== top) return false;
  if (top === 1) return r.top === 1 && r.lookBackSubstep === sub;
  return true;
}

const DBS_SUMMARY_ORDER: ThirdsPersonalDbsObservationType[] = [
  "like",
  "difficult",
  "teaches_about_people",
  "teaches_about_god",
];

function dbsObservationQuestionLabel(t: ThirdsPersonalDbsObservationType): string {
  if (t === "like") return SOLO_DISCOVERY_QUESTIONS.like;
  if (t === "difficult") return SOLO_DISCOVERY_QUESTIONS.difficult;
  if (t === "teaches_about_people") return SOLO_DISCOVERY_QUESTIONS.people;
  return SOLO_DISCOVERY_QUESTIONS.god;
}

function sortDbsObservationsForSummary(rows: ThirdsPersonalDbsObservationDTO[]): ThirdsPersonalDbsObservationDTO[] {
  const rank = (t: ThirdsPersonalDbsObservationType) => DBS_SUMMARY_ORDER.indexOf(t);
  return [...rows].sort((a, b) => rank(a.observation_type) - rank(b.observation_type));
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
  disabled,
  body,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-4 shrink-0 rounded border-input"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {body ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{body}</p>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">(empty last week)</p>
          )}
        </span>
      </label>
    </div>
  );
}

export function ThirdsPersonalWorkspace({
  initial,
  persistence = "server",
}: {
  initial: ThirdsPersonalWorkspacePayload;
  persistence?: "server" | "guest";
}) {
  const isGuest = persistence === "guest";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topSection, setTopSection] = useState<ThirdsRhythmSection>(1);
  const [lookBackSubstep, setLookBackSubstep] = useState<LookBackSubstep>(1);
  /** Where the user was before switching the top stepper (for “Return to …”). */
  const [returnTarget, setReturnTarget] = useState<SoloReturnSnapshot | null>(null);
  const [soloUiMode, setSoloUiMode] = useState<SoloLookUpMode>(initial.soloLookUpMode);

  const sectionFocusRef1 = useRef<HTMLElement | null>(null);
  const sectionFocusRef2 = useRef<HTMLElement | null>(null);
  const sectionFocusRef3 = useRef<HTMLElement | null>(null);
  const sectionFocusRef4 = useRef<HTMLElement | null>(null);
  const sectionFocusRef5 = useRef<HTMLElement | null>(null);

  const [week, setWeek] = useState(initial.week);
  const [priorFinalized] = useState(initial.priorFinalized);
  const [dbsObservations, setDbsObservations] = useState(initial.dbsObservations);

  const readOnly = Boolean(week.finalized_at);

  const toPayload = useCallback(
    (w: ThirdsPersonalWeekDTO, solo: SoloLookUpMode, dbs: ThirdsPersonalDbsObservationDTO[]) =>
      ({
        week: w,
        currentWeekMondayYmd: initial.currentWeekMondayYmd,
        priorFinalized: initial.priorFinalized,
        suggestedLookForward: buildSuggestedLookForward(w, initial.priorFinalized),
        soloLookUpMode: solo,
        dbsObservations: dbs,
      }) satisfies ThirdsPersonalWorkspacePayload,
    [initial.currentWeekMondayYmd, initial.priorFinalized]
  );

  const dbsPrayerSummaryMode = readOnly ? week.completed_look_up_mode : soloUiMode;
  const dbsPrayerSummaryPassage = effectiveThirdsPersonalPassageRef(week).trim();
  const showDbsPrayerSummary =
    dbsPrayerSummaryMode === "dbs" &&
    (dbsObservations.length > 0 || dbsPrayerSummaryPassage.length > 0);

  const [scripturePassage, setScripturePassage] = useState(() =>
    effectiveThirdsPersonalPassageRef(initial.week)
  );
  const [obsLike, setObsLike] = useState(week.observation_like);
  const [obsDiff, setObsDiff] = useState(week.observation_difficult);
  const [obsPpl, setObsPpl] = useState(week.observation_teaches_people);
  const [obsGod, setObsGod] = useState(week.observation_teaches_god);
  const [obedience, setObedience] = useState(initial.week.obedience_statement);
  const [sharing, setSharing] = useState(initial.week.sharing_commitment);
  const [train, setTrain] = useState(initial.week.train_commitment);
  const [shareCareNotes, setShareCareNotes] = useState(initial.week.look_back_share_care);
  const [visionReflectionNotes, setVisionReflectionNotes] = useState(
    initial.week.look_back_vision_reflection
  );

  /** Saved reference string — server: from refreshed props; guest: from in-memory week after local saves. */
  const savedPassageKey = effectiveThirdsPersonalPassageRef(isGuest ? week : initial.week);

  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string }[]>([]);
  const [passageLoading, setPassageLoading] = useState(false);
  const [passageLoadError, setPassageLoadError] = useState<string | null>(null);
  const [lastLoadedInput, setLastLoadedInput] = useState<string | null>(null);

  const loadVersesForRef = useCallback(async (ref: string) => {
    const trimmed = ref.trim();
    if (!trimmed) {
      return { rows: [] as { verse: number; text: string }[], parseError: SOLO_SCRIPTURE_REF_HINT };
    }
    const p = parseSoloScriptureReference(trimmed);
    if (!p.ok) {
      return { rows: [] as { verse: number; text: string }[], parseError: p.message };
    }
    const rows = await fetchPassageVersesRangeInBrowser({
      book: p.book,
      chapter: p.chapter,
      verseStart: p.verseStart,
      verseEnd: p.verseEnd,
    });
    return { rows, parseError: rows.length === 0 ? "No verses found for this range in the library (WEB)." : null };
  }, []);

  /** Loads passage text into state; returns whether verses were loaded (devotional + DBS). */
  const loadPassageForSolo = useCallback(async (): Promise<boolean> => {
    const ref = scripturePassage.trim();
    if (!ref) {
      toast.error(SOLO_SCRIPTURE_REF_HINT);
      return false;
    }
    setPassageLoading(true);
    setPassageLoadError(null);
    const { rows, parseError } = await loadVersesForRef(ref);
    setPassageLoading(false);
    if (parseError) {
      setPassageVerses([]);
      setPassageLoadError(parseError);
      toast.error(parseError);
      setLastLoadedInput(null);
      return false;
    }
    setPassageVerses(rows);
    setPassageLoadError(null);
    setLastLoadedInput(ref);
    return true;
  }, [loadVersesForRef, scripturePassage]);

  useEffect(() => {
    setPassageVerses([]);
    setLastLoadedInput(null);
    setPassageLoadError(null);
  }, [initial.week.id]);

  useEffect(() => {
    const ref = savedPassageKey.trim();
    if (!ref) {
      return;
    }
    let cancelled = false;
    setPassageLoading(true);
    void (async () => {
      const { rows, parseError } = await loadVersesForRef(ref);
      if (cancelled) return;
      setPassageLoading(false);
      if (parseError) {
        setPassageVerses([]);
        setPassageLoadError(null);
        setLastLoadedInput(null);
        return;
      }
      setPassageVerses(rows);
      setPassageLoadError(null);
      setLastLoadedInput(ref);
    })();
    return () => {
      cancelled = true;
    };
  }, [savedPassageKey, loadVersesForRef]);

  useEffect(() => {
    const t = scripturePassage.trim();
    if (lastLoadedInput !== null && t !== lastLoadedInput) {
      setPassageVerses([]);
      setPassageLoadError(null);
      setLastLoadedInput(null);
    }
  }, [scripturePassage, lastLoadedInput]);

  useEffect(() => {
    setSoloUiMode(initial.soloLookUpMode);
  }, [initial.soloLookUpMode]);

  useEffect(() => {
    queueMicrotask(() => {
      setWeek(initial.week);
      setScripturePassage(effectiveThirdsPersonalPassageRef(initial.week));
      setObsLike(initial.week.observation_like);
      setObsDiff(initial.week.observation_difficult);
      setObsPpl(initial.week.observation_teaches_people);
      setObsGod(initial.week.observation_teaches_god);
      setObedience(initial.week.obedience_statement);
      setSharing(initial.week.sharing_commitment);
      setTrain(initial.week.train_commitment);
      setShareCareNotes(initial.week.look_back_share_care);
      setVisionReflectionNotes(initial.week.look_back_vision_reflection);
      setDbsObservations(initial.dbsObservations);
    });
  }, [initial]);

  const refresh = useCallback(() => {
    if (isGuest) {
      saveThirdsState(
        toPayload(week, soloUiMode, dbsObservations)
      );
      return;
    }
    router.refresh();
  }, [isGuest, router, week, soloUiMode, dbsObservations, toPayload]);

  const guestPersistPassageRef = useCallback(
    async (ref: string) => {
      const trimmed = ref.trim().slice(0, 500);
      if (!trimmed) return { error: "Enter a scripture passage." };
      const parsedRef = parseSoloScriptureReference(trimmed);
      if (!parsedRef.ok) return { error: parsedRef.message };
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        passage_ref: trimmed,
        look_up_preset_story_id: null,
        look_up_book: "",
        look_up_chapter: null,
        look_up_verse_start: null,
        look_up_verse_end: null,
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      return { success: true as const };
    },
    [week, soloUiMode, dbsObservations, toPayload]
  );

  const guestPersistDbsObservation = useCallback(
    async (input: {
      observationType: ThirdsPersonalDbsObservationType;
      book: string;
      chapter: number;
      verseNumber: number;
      verseEnd: number | null;
      note: string;
    }): Promise<{ error: string } | { ok: true; dbsLookUpDiscoveryComplete: boolean }> => {
      const passageRef = effectiveThirdsPersonalPassageRef(week).trim();
      if (!passageRef) return { error: "Save your passage reference before observations." };
      const note = input.note.trim().slice(0, 4000);
      if (!note) return { error: "Write your observation before saving." };
      const vStart = Math.floor(Number(input.verseNumber));
      if (!Number.isFinite(vStart) || vStart < 1) {
        return { error: "Choose a valid start verse." };
      }
      let vEnd: number | null = null;
      if (input.verseEnd != null && Number.isFinite(Number(input.verseEnd))) {
        const e = Math.floor(Number(input.verseEnd));
        vEnd = e !== vStart ? e : null;
      }
      if (vEnd != null && vEnd < vStart) {
        return { error: "End verse must be the same as or after the start verse." };
      }
      const ch = Math.floor(Number(input.chapter));
      if (!Number.isFinite(ch) || ch < 1) return { error: "Invalid chapter." };
      const verseErr = validateDbsVerseInPassage(passageRef, input.book, ch, vStart, vEnd);
      if (verseErr) return { error: verseErr };

      const existing = dbsObservations.find((o) => o.observation_type === input.observationType);
      const id =
        existing?.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `guest-obs-${input.observationType}-${Date.now()}`);
      const row: ThirdsPersonalDbsObservationDTO = {
        id,
        personal_week_id: week.id,
        observation_type: input.observationType,
        book: input.book.trim(),
        chapter: ch,
        verse_number: vStart,
        verse_end: vEnd,
        note,
      };
      const nextRows = dbsObservations.filter((o) => o.observation_type !== input.observationType).concat(row);
      setDbsObservations(nextRows);
      saveThirdsState(toPayload(week, soloUiMode, nextRows));
      const complete = dbsObservationListDiscoveryComplete(passageRef, nextRows);
      return { ok: true as const, dbsLookUpDiscoveryComplete: complete };
    },
    [week, dbsObservations, soloUiMode, toPayload]
  );

  const focusTopSectionSurface = useCallback((top: ThirdsRhythmSection, sub?: LookBackSubstep) => {
    const el =
      top === 1
        ? sub === 2
          ? sectionFocusRef2.current
          : sub === 3
            ? sectionFocusRef3.current
            : sectionFocusRef1.current
        : top === 2
          ? sectionFocusRef4.current
          : sectionFocusRef5.current;
    window.requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }, []);

  const handleStepperSectionChange = useCallback(
    (next: ThirdsRhythmSection) => {
      if (next === topSection) return;
      setReturnTarget(
        topSection === 1
          ? { top: 1, lookBackSubstep }
          : topSection === 2
            ? { top: 2 }
            : { top: 3 }
      );
      setTopSection(next);
      queueMicrotask(() => {
        if (next === 1) focusTopSectionSurface(1, lookBackSubstep);
        else if (next === 2) focusTopSectionSurface(2);
        else focusTopSectionSurface(3);
      });
    },
    [topSection, lookBackSubstep, focusTopSectionSurface]
  );

  const handleReturnToTarget = useCallback(() => {
    if (returnTarget === null) return;
    const target = returnTarget;
    setReturnTarget(null);
    setTopSection(target.top);
    if (target.top === 1) {
      setLookBackSubstep(target.lookBackSubstep);
    }
    queueMicrotask(() => {
      if (target.top === 1) focusTopSectionSurface(1, target.lookBackSubstep);
      else if (target.top === 2) focusTopSectionSurface(2);
      else focusTopSectionSurface(3);
    });
  }, [returnTarget, focusTopSectionSurface]);

  useEffect(() => {
    setTopSection(1);
    setLookBackSubstep(1);
    setReturnTarget(null);
  }, [initial.week.id]);

  const onSoloLookUpModeChange = (mode: SoloLookUpMode) => {
    if (readOnly) return;
    setSoloUiMode(mode);
    if (isGuest) {
      saveThirdsState(toPayload(week, mode, dbsObservations));
      return;
    }
    startTransition(async () => {
      const r = await setThirdsSoloLookUpPreference(mode);
      if ("error" in r) {
        toast.error(r.error);
        refresh();
        return;
      }
      refresh();
    });
  };

  const onSaveLookBack = () => {
    if (isGuest) {
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        prior_obedience_done: week.prior_obedience_done,
        prior_sharing_done: week.prior_sharing_done,
        prior_train_done: week.prior_train_done,
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      toast.success("Checking In saved");
      setReturnTarget(null);
      setLookBackSubstep(3);
      queueMicrotask(() => focusTopSectionSurface(1, 3));
      return;
    }
    startTransition(async () => {
      const r = await saveThirdsPersonalLookBack({
        priorObedienceDone: week.prior_obedience_done,
        priorSharingDone: week.prior_sharing_done,
        priorTrainDone: week.prior_train_done,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Checking In saved");
        setReturnTarget(null);
        setLookBackSubstep(3);
        queueMicrotask(() => focusTopSectionSurface(1, 3));
        refresh();
      }
    });
  };

  const onSaveShareCareNotes = () => {
    if (isGuest) {
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        look_back_share_care: shareCareNotes.trim().slice(0, 4000),
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      toast.success("Share & Care saved");
      return;
    }
    startTransition(async () => {
      const r = await saveThirdsPersonalLookBackJournal({ shareCareNotes });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Share & Care saved");
        refresh();
      }
    });
  };

  const onSaveVisionReflection = () => {
    if (isGuest) {
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        look_back_vision_reflection: visionReflectionNotes.trim().slice(0, 4000),
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      toast.success("Vision reflection saved");
      return;
    }
    startTransition(async () => {
      const r = await saveThirdsPersonalLookBackJournal({ visionReflectionNotes });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Vision reflection saved");
        refresh();
      }
    });
  };

  const onSaveLookUp = () => {
    if (!scripturePassage.trim()) {
      toast.error(SOLO_SCRIPTURE_REF_HINT);
      return;
    }
    if (isGuest) {
      const ref = scripturePassage.trim().slice(0, 500);
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        passage_ref: ref,
        look_up_preset_story_id: null,
        look_up_book: "",
        look_up_chapter: null,
        look_up_verse_start: null,
        look_up_verse_end: null,
        observation_like: obsLike.trim().slice(0, 4000),
        observation_difficult: obsDiff.trim().slice(0, 4000),
        observation_teaches_people: obsPpl.trim().slice(0, 4000),
        observation_teaches_god: obsGod.trim().slice(0, 4000),
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      toast.success("Look Up saved");
      setReturnTarget(null);
      setTopSection(3);
      queueMicrotask(() => focusTopSectionSurface(3));
      return;
    }
    startTransition(async () => {
      const r = await saveThirdsPersonalLookUp({
        scriptureReference: scripturePassage,
        observationLike: obsLike,
        observationDifficult: obsDiff,
        observationTeachesPeople: obsPpl,
        observationTeachesGod: obsGod,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Look Up saved");
        setReturnTarget(null);
        setTopSection(3);
        queueMicrotask(() => focusTopSectionSurface(3));
        refresh();
      }
    });
  };

  const onSaveLookForward = () => {
    if (isGuest) {
      const nextWeek: ThirdsPersonalWeekDTO = {
        ...week,
        obedience_statement: obedience.trim().slice(0, 4000),
        sharing_commitment: sharing.trim().slice(0, 4000),
        train_commitment: train.trim().slice(0, 4000),
      };
      setWeek(nextWeek);
      saveThirdsState(toPayload(nextWeek, soloUiMode, dbsObservations));
      toast.success("Look Forward saved");
      setReturnTarget(null);
      setTopSection(3);
      queueMicrotask(() => focusTopSectionSurface(3));
      router.push("/app/groups/personal-thirds/practice");
      return;
    }
    startTransition(async () => {
      const r = await saveThirdsPersonalLookForward({
        obedienceStatement: obedience,
        sharingCommitment: sharing,
        trainCommitment: train,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Look Forward saved");
        setReturnTarget(null);
        setTopSection(3);
        queueMicrotask(() => focusTopSectionSurface(3));
        refresh();
        router.push("/app/groups/personal-thirds/practice");
      }
    });
  };

  const onDbsLookUpDiscoveryComplete = useCallback(() => {
    setReturnTarget(null);
    setTopSection(3);
    queueMicrotask(() => focusTopSectionSurface(3));
  }, [focusTopSectionSurface]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Week of {formatParticipationWeekLong(initial.currentWeekMondayYmd)}
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">Personal 3/3rds</h1>
        </div>
        {readOnly ? (
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              This week is finalized
            </span>
            {week.completed_look_up_mode === "dbs" ? (
              <span className="text-right text-[0.65rem] text-muted-foreground">
                Look Up: Discovery Bible Study mode
              </span>
            ) : week.completed_look_up_mode === "devotional" ? (
              <span className="text-right text-[0.65rem] text-muted-foreground">
                Look Up: Devotional mode
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            disabled={readOnly || pending}
            aria-label="Look Up study options"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors touch-manipulation",
              "hover:bg-muted/60 hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <Settings className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[min(calc(100vw-2rem),20rem)] p-0 sm:w-80">
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-xs font-medium text-foreground">Look Up study style</p>
              <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
                Current:{" "}
                <span className="font-medium text-foreground">
                  {soloUiMode === "dbs" ? "DBS Mode" : "Devotional Mode"}
                </span>
              </p>
            </div>
            <div className="space-y-2 px-3 py-2.5 text-[0.7rem] leading-snug text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">DBS</span> — passage-first discovery with verse-anchored
                notes (similar to group Look Up).
              </p>
              <p>
                <span className="font-medium text-foreground">Devotional</span> — reflective journaling with four
                free-form responses; no verse anchoring required.
              </p>
            </div>
            <div className="border-t border-border p-1">
              <DropdownMenuItem
                onClick={() => {
                  if (pending) return;
                  onSoloLookUpModeChange("dbs");
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 py-2.5",
                  pending && "pointer-events-none opacity-50"
                )}
              >
                <span className="font-medium text-foreground">DBS Mode</span>
                {soloUiMode === "dbs" ? <Check className="size-4 shrink-0 text-foreground" aria-hidden /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (pending) return;
                  onSoloLookUpModeChange("devotional");
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 py-2.5",
                  pending && "pointer-events-none opacity-50"
                )}
              >
                <span className="font-medium text-foreground">Devotional Mode</span>
                {soloUiMode === "devotional" ? (
                  <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ThirdsRhythmStepper activeSection={topSection} onSectionChange={handleStepperSectionChange} />

      {returnTarget !== null && !atSoloReturnSnapshot(returnTarget, topSection, lookBackSubstep) ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto min-h-10 px-2 py-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground"
            onClick={handleReturnToTarget}
          >
            Return to {soloReturnLabel(returnTarget)}
          </Button>
        </div>
      ) : null}

      {topSection === 1 ? (
        <LookBackSubstepIndicator
          activeSubstep={lookBackSubstep}
          onSubstepChange={(sub) => {
            setLookBackSubstep(sub);
            queueMicrotask(() => focusTopSectionSurface(1, sub));
          }}
          allowSubstepNavigation
          className="rounded-lg border border-border/80 bg-card/40 px-3 py-2.5 sm:px-4"
        />
      ) : null}

      {topSection === 1 && lookBackSubstep === 1 && (
        <section
          ref={sectionFocusRef1}
          id="personal-thirds-surface-share-care"
          tabIndex={-1}
          aria-label={`${SOLO_TOP_LABELS[1]} · ${LOOK_BACK_SUB_LABELS[1]}`}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div>
            <h2 className="text-lg font-medium text-foreground">Share & Care</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where God is at work, what has been difficult or glad, prayer needs, and how he is teaching you.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-3")}>
            <Label className={meetingYourLabel}>Reflection (optional)</Label>
            <Textarea
              className={meetingTextareaClass()}
              value={shareCareNotes}
              disabled={readOnly}
              onChange={(e) => setShareCareNotes(e.target.value)}
              rows={5}
              placeholder="Prayer needs, gratitude, tension, what you are learning from the Lord…"
            />
            {!readOnly ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={onSaveShareCareNotes} disabled={pending}>
                  Save Share & Care
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setLookBackSubstep(2);
                    queueMicrotask(() => focusTopSectionSurface(1, 2));
                  }}
                  disabled={pending}
                >
                  Continue to Checking In
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {topSection === 1 && lookBackSubstep === 2 && (
        <section
          ref={sectionFocusRef2}
          id="personal-thirds-surface-checking-in"
          tabIndex={-1}
          aria-label={`${SOLO_TOP_LABELS[1]} · ${LOOK_BACK_SUB_LABELS[2]}`}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div>
            <h2 className="text-lg font-medium text-foreground">Checking In</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review last week&apos;s obey · share · train. Anything left unchecked stays visible in Look Forward.
            </p>
          </div>
          {!priorFinalized ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a prior finalized solo week yet. After your first finalized week, checkboxes will
              appear here.
            </p>
          ) : (
            <div className={cn(meetingYourRegion, "space-y-3")}>
              <CheckRow
                id="prior-obey"
                label="Obey — completed"
                checked={week.prior_obedience_done}
                disabled={readOnly}
                onChange={(v) => setWeek((w) => ({ ...w, prior_obedience_done: v }))}
                body={priorFinalized.obedience_statement}
              />
              <CheckRow
                id="prior-share"
                label="Share — completed"
                checked={week.prior_sharing_done}
                disabled={readOnly}
                onChange={(v) => setWeek((w) => ({ ...w, prior_sharing_done: v }))}
                body={priorFinalized.sharing_commitment}
              />
              <CheckRow
                id="prior-train"
                label="Train — completed"
                checked={week.prior_train_done}
                disabled={readOnly}
                onChange={(v) => setWeek((w) => ({ ...w, prior_train_done: v }))}
                body={priorFinalized.train_commitment}
              />
              {!readOnly ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={onSaveLookBack} disabled={pending}>
                    Save Checking In
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setLookBackSubstep(3);
                      queueMicrotask(() => focusTopSectionSurface(1, 3));
                    }}
                    disabled={pending}
                  >
                    Continue to Vision
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      )}

      {topSection === 1 && lookBackSubstep === 3 && (
        <section
          ref={sectionFocusRef3}
          id="personal-thirds-surface-vision"
          tabIndex={-1}
          aria-label={`${SOLO_TOP_LABELS[1]} · ${LOOK_BACK_SUB_LABELS[3]}`}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div>
            <h2 className="text-lg font-medium text-foreground">Vision</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Re-center on the commission before Look Up—no scorekeeping, just a short breath toward the harvest.
            </p>
          </div>
          <LookBackVisionEncouragement />
          <div className={cn(meetingYourRegion, "space-y-3")}>
            <Label className={meetingYourLabel}>Personal recommissioning (optional)</Label>
            <Textarea
              className={meetingTextareaClass()}
              value={visionReflectionNotes}
              disabled={readOnly}
              onChange={(e) => setVisionReflectionNotes(e.target.value)}
              rows={4}
              placeholder="Who is on your heart? Where might you step toward obedience, sharing, or training this week?"
            />
            {!readOnly ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={onSaveVisionReflection} disabled={pending}>
                  Save Vision note
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTopSection(2);
                    queueMicrotask(() => focusTopSectionSurface(2));
                  }}
                  disabled={pending}
                >
                  Continue to Look Up
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {topSection === 2 && readOnly && week.completed_look_up_mode === "dbs" && (
        <section
          ref={sectionFocusRef4}
          id="personal-thirds-surface-4"
          tabIndex={-1}
          aria-label={SOLO_TOP_LABELS[2]}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div className="rounded-lg border border-sky-200/60 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20">
            <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">Look Up (saved)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Discovery Bible Study mode — verse-anchored observations for this finalized week.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-6")}>
            <p className="text-sm font-medium text-foreground">{effectiveThirdsPersonalPassageRef(week)}</p>
            {dbsObservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No verse-anchored observations were stored for this week.</p>
            ) : null}
            {dbsObservations.map((ob) => {
              const label =
                ob.observation_type === "like"
                  ? SOLO_DISCOVERY_QUESTIONS.like
                  : ob.observation_type === "difficult"
                    ? SOLO_DISCOVERY_QUESTIONS.difficult
                    : ob.observation_type === "teaches_about_people"
                      ? SOLO_DISCOVERY_QUESTIONS.people
                      : SOLO_DISCOVERY_QUESTIONS.god;
              const vEnd =
                ob.verse_end != null && ob.verse_end !== ob.verse_number ? ob.verse_end : undefined;
              const refLine = formatObservationVerseRef({
                book: ob.book,
                chapter: ob.chapter,
                verseStart: ob.verse_number,
                verseEnd: vEnd,
              });
              return (
                <div key={ob.id} className="rounded-lg border border-border bg-card/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xs font-medium text-sky-900 dark:text-sky-200">{refLine}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{ob.note}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {topSection === 2 && readOnly && week.completed_look_up_mode !== "dbs" && (
        <section
          ref={sectionFocusRef4}
          id="personal-thirds-surface-4"
          tabIndex={-1}
          aria-label={SOLO_TOP_LABELS[2]}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div className="rounded-lg border border-sky-200/60 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20">
            <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">Look Up (saved)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Devotional mode — reflective journaling without required verse anchors.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-4")}>
            <div className="rounded-lg border border-border bg-card/80 shadow-sm">
              <p className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                {scripturePassage.trim() || "Passage"}
              </p>
              <div className="max-h-72 overflow-y-auto px-3 py-3">
                {passageVerses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Passage text was not loaded for display.</p>
                ) : (
                  <div className="space-y-2">
                    {passageVerses.map((v) => (
                      <p key={v.verse} className="text-sm leading-relaxed text-foreground">
                        <sup className="mr-1 font-mono text-[11px] text-muted-foreground">{v.verse}</sup>
                        {v.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.like}</Label>
              <Textarea className={meetingTextareaClass()} value={obsLike} readOnly rows={3} />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.difficult}</Label>
              <Textarea className={meetingTextareaClass()} value={obsDiff} readOnly rows={3} />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.people}</Label>
              <Textarea className={meetingTextareaClass()} value={obsPpl} readOnly rows={3} />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.god}</Label>
              <Textarea className={meetingTextareaClass()} value={obsGod} readOnly rows={3} />
            </div>
          </div>
        </section>
      )}

      {topSection === 2 && !readOnly && soloUiMode === "dbs" && (
        <section
          ref={sectionFocusRef4}
          id="personal-thirds-surface-4"
          tabIndex={-1}
          aria-label={SOLO_TOP_LABELS[2]}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          key="dbs-look-up"
        >
          <ThirdsPersonalDbsLookUp
            scripturePassage={scripturePassage}
            onScripturePassageChange={setScripturePassage}
            passageVerses={passageVerses}
            passageLoading={passageLoading}
            passageLoadError={passageLoadError}
            onLoadPassage={loadPassageForSolo}
            readOnly={readOnly}
            dbsObservations={dbsObservations}
            onRefresh={refresh}
            onDbsLookUpDiscoveryComplete={onDbsLookUpDiscoveryComplete}
            persistPassageRef={isGuest ? guestPersistPassageRef : undefined}
            persistDbsObservation={isGuest ? guestPersistDbsObservation : undefined}
          />
        </section>
      )}

      {topSection === 2 && !readOnly && soloUiMode === "devotional" && (
        <section
          ref={sectionFocusRef4}
          id="personal-thirds-surface-4"
          tabIndex={-1}
          aria-label={SOLO_TOP_LABELS[2]}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div className="rounded-lg border border-sky-200/60 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20">
            <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">Look Up — Devotional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Low-friction reflective journaling: load a passage for context, then capture four written responses. No
              verse anchoring required.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-4")}>
            <div className="space-y-2">
              <Label htmlFor="solo-scripture-passage" className="text-base font-medium">
                Scripture passage
              </Label>
              <p className="text-xs text-muted-foreground">
                Examples: Matthew 13:1-58 · Exodus 19:4-6 · John 3:16 · Psalm 23 · 1 Peter 2:9-12
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Input
                  id="solo-scripture-passage"
                  value={scripturePassage}
                  disabled={readOnly}
                  onChange={(e) => setScripturePassage(e.target.value)}
                  placeholder="Example: Matthew 13:1-58"
                  className="min-h-11 flex-1 font-medium text-base md:text-base"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 sm:mt-0"
                    onClick={() => void loadPassageForSolo()}
                    disabled={pending || passageLoading}
                  >
                    {passageLoading ? "Loading…" : "Load passage"}
                  </Button>
                ) : null}
              </div>
              {passageLoadError ? (
                <p className="text-sm text-destructive" role="alert">
                  {passageLoadError}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-border bg-card/80 shadow-sm">
              <p className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                {scripturePassage.trim() || "Passage"}
              </p>
              <div className="max-h-72 overflow-y-auto px-3 py-3">
                {passageLoading ? (
                  <p className="text-sm text-muted-foreground">Loading passage…</p>
                ) : passageVerses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Load a passage to read it here, or adjust the reference and try again.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {passageVerses.map((v) => (
                      <p key={v.verse} className="text-sm leading-relaxed text-foreground">
                        <sup className="mr-1 font-mono text-[11px] text-muted-foreground">{v.verse}</sup>
                        {v.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.like}</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsLike}
                disabled={readOnly}
                onChange={(e) => setObsLike(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.difficult}</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsDiff}
                disabled={readOnly}
                onChange={(e) => setObsDiff(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.people}</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsPpl}
                disabled={readOnly}
                onChange={(e) => setObsPpl(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>{SOLO_DISCOVERY_QUESTIONS.god}</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsGod}
                disabled={readOnly}
                onChange={(e) => setObsGod(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="button" onClick={onSaveLookUp} disabled={pending}>
              Save Look Up
            </Button>
          </div>
        </section>
      )}

      {topSection === 3 && (
        <section
          ref={sectionFocusRef5}
          id="personal-thirds-surface-5"
          tabIndex={-1}
          aria-label={SOLO_TOP_LABELS[3]}
          className={cn(
            meetingSectionPadding,
            "space-y-4",
            "scroll-mt-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <div className="rounded-lg border border-[color:var(--color-lookforward)]/35 bg-[color:var(--color-lookforward-bg)] px-4 py-3">
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Look Forward
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Obey · Share · Train for this week. Last week&apos;s commitments stay in Checking In for anything you left
              unchecked.
            </p>
          </div>
          {showDbsPrayerSummary ? (
            <aside
              className="rounded-lg border border-sky-200/60 bg-sky-50/35 px-4 py-3.5 dark:border-sky-900/50 dark:bg-sky-950/25"
              aria-labelledby="personal-thirds-dbs-summary-heading"
            >
              <h2
                id="personal-thirds-dbs-summary-heading"
                className="text-xs font-semibold uppercase tracking-wide text-sky-950 dark:text-sky-100"
              >
                Discovery notes for prayer
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Use this summary as you write Obey · Share · Train below.
              </p>
              {dbsPrayerSummaryPassage ? (
                <p className="mt-3 text-sm font-medium text-foreground">{dbsPrayerSummaryPassage}</p>
              ) : null}
              {dbsObservations.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Verse-anchored answers from Look Up will appear here as you save each discovery prompt.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {sortDbsObservationsForSummary(dbsObservations).map((ob) => {
                    const vEnd =
                      ob.verse_end != null && ob.verse_end !== ob.verse_number ? ob.verse_end : undefined;
                    const refLine = formatObservationVerseRef({
                      book: ob.book,
                      chapter: ob.chapter,
                      verseStart: ob.verse_number,
                      verseEnd: vEnd,
                    });
                    return (
                      <li
                        key={ob.id}
                        className="border-t border-sky-200/50 pt-3 first:border-t-0 first:pt-0 dark:border-sky-800/50"
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          {dbsObservationQuestionLabel(ob.observation_type)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-sky-900 dark:text-sky-200">{refLine}</p>
                        {ob.note.trim() ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/95">{ob.note.trim()}</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">(No note saved for this prompt.)</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          ) : null}
          <div className={cn(meetingYourRegion, "space-y-4")}>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>Obey (application)</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obedience}
                disabled={readOnly}
                onChange={(e) => setObedience(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>Share</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={sharing}
                disabled={readOnly}
                onChange={(e) => setSharing(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>Train</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={train}
                disabled={readOnly}
                onChange={(e) => setTrain(e.target.value)}
                rows={3}
              />
            </div>
            {!readOnly ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onSaveLookForward} disabled={pending} className="touch-manipulation">
                  Save Look Forward
                </Button>
              </div>
            ) : null}
            {!readOnly ? (
              <p className="text-xs text-muted-foreground">
                {isGuest
                  ? "Tap Save Look Forward to store obey, share, and train in this browser session—you will move on to practice, then Complete 3/3 to mark the week finished locally."
                  : "Tap Save Look Forward to store obey, share, and train—you will move on to practice with a partner, then Complete 3/3 to count this pillar week."}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This week is finalized; Look Forward is read-only.
              </p>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
