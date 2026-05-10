"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveThirdsPersonalPassageRef } from "@/app/actions/thirds-personal";
import type {
  ThirdsPersonalDbsObservationDTO,
  ThirdsPersonalDbsObservationType,
} from "@/lib/groups/thirds-personal-types";
import { SOLO_DISCOVERY_QUESTIONS } from "@/lib/groups/solo-discovery-prompts";
import { parseSoloScriptureReference, SOLO_SCRIPTURE_REF_HINT } from "@/lib/groups/solo-scripture-reference-parse";
import { meetingSectionPadding, meetingYourRegion } from "@/components/groups/meeting-input-layout";
import {
  SoloDbsObservationField,
  type SoloDbsObservationFieldHandle,
} from "@/components/groups/solo-dbs-observation-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DbsStep = "read" | "retell" | "like" | "difficult" | "reread" | "people" | "god";

/** Slightly generous top margin so the step kicker clears the sticky header (matches discovery steps in layout). */
const dbsStepScrollAnchorClass =
  "scroll-mt-28 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:scroll-mt-32";

function obsFor(
  rows: ThirdsPersonalDbsObservationDTO[],
  t: ThirdsPersonalDbsObservationType
): ThirdsPersonalDbsObservationDTO | undefined {
  return rows.find((r) => r.observation_type === t);
}

export function ThirdsPersonalDbsLookUp({
  scripturePassage,
  onScripturePassageChange,
  passageVerses,
  passageLoading,
  passageLoadError,
  onLoadPassage,
  readOnly,
  dbsObservations,
  onRefresh,
  onDbsLookUpDiscoveryComplete,
  /** Guest/local: persist passage ref without Supabase (server path uses {@link saveThirdsPersonalPassageRef}). */
  persistPassageRef,
  /** Guest/local: persist DBS observation rows without Supabase. */
  persistDbsObservation,
}: {
  scripturePassage: string;
  onScripturePassageChange: (v: string) => void;
  passageVerses: { verse: number; text: string }[];
  passageLoading: boolean;
  passageLoadError: string | null;
  /** Fetch passage verses into parent state; return true when verses loaded successfully. */
  onLoadPassage: () => Promise<boolean>;
  readOnly: boolean;
  dbsObservations: ThirdsPersonalDbsObservationDTO[];
  onRefresh: () => void;
  /** When all four verse-anchored observations satisfy finalize rules (after any successful save). */
  onDbsLookUpDiscoveryComplete?: () => void;
  persistPassageRef?: (trimmedRef: string) => Promise<{ error: string } | { success: true }>;
  persistDbsObservation?: (input: {
    observationType: ThirdsPersonalDbsObservationType;
    book: string;
    chapter: number;
    verseNumber: number;
    verseEnd: number | null;
    note: string;
  }) => Promise<{ error: string } | { ok: true; dbsLookUpDiscoveryComplete: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<DbsStep>("read");
  const observationFieldRef = useRef<SoloDbsObservationFieldHandle>(null);
  const dbsStepAnchorRef = useRef<HTMLDivElement>(null);
  const prevDbsStepRef = useRef<DbsStep | null>(null);
  const [obsNavPending, setObsNavPending] = useState(false);

  useLayoutEffect(() => {
    if (prevDbsStepRef.current === null) {
      prevDbsStepRef.current = step;
      return;
    }
    if (prevDbsStepRef.current === step) {
      return;
    }
    prevDbsStepRef.current = step;
    const el = dbsStepAnchorRef.current;
    if (!el) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    });
  }, [step]);

  const parsed = useMemo(
    () => parseSoloScriptureReference(scripturePassage.trim()),
    [scripturePassage]
  );

  const anchor = useMemo(() => {
    if (!parsed.ok) return null;
    return { book: parsed.book, chapter: parsed.chapter };
  }, [parsed]);

  const dis = readOnly || pending || obsNavPending;

  const flushObservation = useCallback(async () => {
    setObsNavPending(true);
    try {
      return (await observationFieldRef.current?.saveUncommittedObservation()) ?? false;
    } finally {
      setObsNavPending(false);
    }
  }, []);

  const saveObservationThen = useCallback(
    (go: () => void) => {
      void flushObservation().then((ok) => {
        if (ok) go();
      });
    },
    [flushObservation]
  );

  const handleLoadPassageOnReadStep = useCallback(() => {
    if (readOnly || passageLoading) return;
    void (async () => {
      const loaded = await onLoadPassage();
      if (!loaded) return;
      const ref = scripturePassage.trim();
      if (!ref) {
        toast.error(SOLO_SCRIPTURE_REF_HINT);
        return;
      }
      if (!parsed.ok) {
        toast.error(parsed.message);
        return;
      }
      startTransition(async () => {
        const r = persistPassageRef
          ? await persistPassageRef(ref)
          : await saveThirdsPersonalPassageRef({ scriptureReference: ref });
        if ("error" in r) {
          toast.error(r.error);
          return;
        }
        toast.success("Passage loaded and saved");
        setStep("retell");
        onRefresh();
      });
    })();
  }, [readOnly, passageLoading, onLoadPassage, scripturePassage, parsed, onRefresh, persistPassageRef]);

  const goReread = useCallback(async () => {
    if (passageVerses.length === 0) return;
    setStep("reread");
  }, [passageVerses.length]);

  const readAgainBlock = (
    <div className={cn("rounded-lg border border-border bg-card/80 shadow-sm", meetingSectionPadding)}>
      <h3 className="text-base font-medium text-foreground">Read again</h3>
      <p className="mt-1 text-sm text-muted-foreground">Read the passage slowly once more before the last two questions.</p>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {passageVerses.map((v) => (
          <p key={v.verse} className="text-sm leading-relaxed text-foreground">
            <sup className="mr-1 font-mono text-[11px] text-muted-foreground">{v.verse}</sup>
            {v.text}
          </p>
        ))}
      </div>
      <Button type="button" className="mt-4" disabled={dis} onClick={() => setStep("people")}>
        Continue to people question
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sky-200/60 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20">
        <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">Look Up — Discovery Bible Study</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A personal, passage-first flow: read, retell (optional), reflect with verse-anchored notes for each discovery
          question.
        </p>
      </div>

      {step === "read" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-4", dbsStepScrollAnchorClass)}
          aria-label="Read the passage"
        >
          <div className="space-y-2">
            <Label htmlFor="dbs-scripture-passage" className="text-base font-medium">
              Scripture passage
            </Label>
            <p className="text-xs text-muted-foreground">{SOLO_SCRIPTURE_REF_HINT}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                id="dbs-scripture-passage"
                value={scripturePassage}
                disabled={readOnly}
                onChange={(e) => onScripturePassageChange(e.target.value)}
                placeholder="Example: Matthew 13:1-58"
                className="min-h-11 flex-1 font-medium"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {!readOnly ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={handleLoadPassageOnReadStep}
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

          {passageVerses.length > 0 ? (
            <div className="rounded-lg border border-border bg-card/80 shadow-sm">
              <p className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                {scripturePassage.trim() || "Passage"}
              </p>
              <div className="max-h-56 overflow-y-auto px-3 py-3">
                <p className="mb-2 text-sm text-muted-foreground">
                  Read the passage out loud to yourself, slowly and clearly.
                </p>
                <div className="space-y-2">
                  {passageVerses.map((v) => (
                    <p key={v.verse} className="text-sm leading-relaxed text-foreground">
                      <sup className="mr-1 font-mono text-[11px] text-muted-foreground">{v.verse}</sup>
                      {v.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {step === "retell" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-4", dbsStepScrollAnchorClass)}
          aria-label="Retell"
        >
          <div className={cn("rounded-lg border border-border", meetingSectionPadding)}>
            <h3 className="text-base font-medium text-foreground">Retell (optional)</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Retell the passage out loud in your own words. Nothing is written down here—this step is only for your
              reflection and is not saved to your week record.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={dis} onClick={() => setStep("read")}>
              ← Back to read
            </Button>
            <Button type="button" disabled={dis} onClick={() => setStep("like")}>
              Continue to discovery questions
            </Button>
          </div>
        </div>
      )}

      {step === "like" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-2", dbsStepScrollAnchorClass)}
          aria-label="Discovery question: Like"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discovery · Like</p>
            <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {SOLO_DISCOVERY_QUESTIONS.like}
            </h3>
          </div>
          <SoloDbsObservationField
            ref={observationFieldRef}
            observationType="like"
            anchor={anchor}
            passageVerses={passageVerses}
            readOnly={readOnly}
            disabled={dis}
            initialRow={obsFor(dbsObservations, "like")}
            weekDbsObservations={dbsObservations}
            onPersistSuccess={onRefresh}
            onDbsLookUpDiscoveryComplete={onDbsLookUpDiscoveryComplete}
            persistDbsObservation={persistDbsObservation}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" disabled={dis} onClick={() => setStep("retell")}>
              ← Back
            </Button>
            <Button type="button" disabled={dis} onClick={() => saveObservationThen(() => setStep("difficult"))}>
              Next question
            </Button>
          </div>
        </div>
      )}

      {step === "difficult" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-2", dbsStepScrollAnchorClass)}
          aria-label="Discovery question: Difficult"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discovery · Difficult</p>
            <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {SOLO_DISCOVERY_QUESTIONS.difficult}
            </h3>
          </div>
          <SoloDbsObservationField
            ref={observationFieldRef}
            observationType="difficult"
            anchor={anchor}
            passageVerses={passageVerses}
            readOnly={readOnly}
            disabled={dis}
            initialRow={obsFor(dbsObservations, "difficult")}
            weekDbsObservations={dbsObservations}
            onPersistSuccess={onRefresh}
            onDbsLookUpDiscoveryComplete={onDbsLookUpDiscoveryComplete}
            persistDbsObservation={persistDbsObservation}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" disabled={dis} onClick={() => setStep("like")}>
              ← Back
            </Button>
            <Button
              type="button"
              disabled={dis}
              onClick={() =>
                saveObservationThen(() => {
                  if (passageVerses.length > 0) void goReread();
                  else setStep("people");
                })
              }
            >
              {passageVerses.length > 0 ? "Read again, then continue" : "Continue (no passage text)"}
            </Button>
          </div>
        </div>
      )}

      {step === "reread" && passageVerses.length > 0 ? (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-4", dbsStepScrollAnchorClass)}
          aria-label="Read again"
        >
          {readAgainBlock}
          <Button type="button" variant="outline" disabled={dis} onClick={() => setStep("difficult")}>
            ← Back
          </Button>
        </div>
      ) : null}

      {step === "people" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-2", dbsStepScrollAnchorClass)}
          aria-label="Discovery question: People"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discovery · People</p>
            <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {SOLO_DISCOVERY_QUESTIONS.people}
            </h3>
          </div>
          <SoloDbsObservationField
            ref={observationFieldRef}
            observationType="teaches_about_people"
            anchor={anchor}
            passageVerses={passageVerses}
            readOnly={readOnly}
            disabled={dis}
            initialRow={obsFor(dbsObservations, "teaches_about_people")}
            weekDbsObservations={dbsObservations}
            onPersistSuccess={onRefresh}
            onDbsLookUpDiscoveryComplete={onDbsLookUpDiscoveryComplete}
            persistDbsObservation={persistDbsObservation}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={dis}
              onClick={() => setStep(passageVerses.length > 0 ? "reread" : "difficult")}
            >
              ← Back
            </Button>
            <Button type="button" disabled={dis} onClick={() => saveObservationThen(() => setStep("god"))}>
              Next question
            </Button>
          </div>
        </div>
      )}

      {step === "god" && (
        <div
          ref={dbsStepAnchorRef}
          tabIndex={-1}
          className={cn(meetingYourRegion, "space-y-2", dbsStepScrollAnchorClass)}
          aria-label="Discovery question: God"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discovery · God</p>
            <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {SOLO_DISCOVERY_QUESTIONS.god}
            </h3>
          </div>
          <SoloDbsObservationField
            ref={observationFieldRef}
            observationType="teaches_about_god"
            anchor={anchor}
            passageVerses={passageVerses}
            readOnly={readOnly}
            disabled={dis}
            initialRow={obsFor(dbsObservations, "teaches_about_god")}
            weekDbsObservations={dbsObservations}
            onPersistSuccess={onRefresh}
            onDbsLookUpDiscoveryComplete={onDbsLookUpDiscoveryComplete}
            persistDbsObservation={persistDbsObservation}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" disabled={dis} onClick={() => setStep("people")}>
              ← Back
            </Button>
            <Button type="button" disabled={dis} onClick={() => void flushObservation()}>
              Finish
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap <span className="font-medium text-foreground">Finish</span> to save this observation, then open{" "}
            <span className="font-medium text-foreground">Look Forward</span> in the steps above to complete your week
            when all four prompts are done.
          </p>
        </div>
      )}
    </div>
  );
}
