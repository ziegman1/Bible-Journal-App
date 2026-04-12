"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  finalizeThirdsPersonalWeek,
  recordThirdsPersonalGroupComplete,
  saveThirdsPersonalLookBack,
  saveThirdsPersonalLookForward,
  saveThirdsPersonalLookUp,
} from "@/app/actions/thirds-personal";
import type { ThirdsPersonalWorkspacePayload } from "@/lib/groups/thirds-personal-types";
import {
  meetingSectionPadding,
  meetingTextareaClass,
  meetingYourLabel,
  meetingYourRegion,
} from "@/components/groups/meeting-input-layout";
import { ThreeThirdsStepper } from "@/components/groups/three-thirds-stepper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  buildSuggestedLookForward,
  effectiveThirdsPersonalPassageRef,
} from "@/lib/groups/thirds-personal-helpers";
import {
  parseSoloScriptureReference,
  SOLO_SCRIPTURE_REF_HINT,
} from "@/lib/groups/solo-scripture-reference-parse";
import { fetchPassageVersesRangeInBrowser } from "@/lib/scripture/fetch-passage-verses-browser";
import { cn } from "@/lib/utils";

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

export function ThirdsPersonalWorkspace({ initial }: { initial: ThirdsPersonalWorkspacePayload }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [section, setSection] = useState<1 | 2 | 3>(1);

  const [week, setWeek] = useState(initial.week);
  const [priorFinalized] = useState(initial.priorFinalized);

  const readOnly = Boolean(week.finalized_at);

  const [scripturePassage, setScripturePassage] = useState(() =>
    effectiveThirdsPersonalPassageRef(initial.week)
  );
  const [obsLike, setObsLike] = useState(week.observation_like);
  const [obsDiff, setObsDiff] = useState(week.observation_difficult);
  const [obsPpl, setObsPpl] = useState(week.observation_teaches_people);
  const [obsGod, setObsGod] = useState(week.observation_teaches_god);
  const [obedience, setObedience] = useState(
    initial.week.obedience_statement || initial.suggestedLookForward.obedience_statement
  );
  const [sharing, setSharing] = useState(
    initial.week.sharing_commitment || initial.suggestedLookForward.sharing_commitment
  );
  const [train, setTrain] = useState(
    initial.week.train_commitment || initial.suggestedLookForward.train_commitment
  );

  /** Server-saved reference string — when this changes (e.g. after refresh), reload passage text. */
  const savedPassageKey = effectiveThirdsPersonalPassageRef(initial.week);

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

  const onLoadPassage = useCallback(() => {
    const ref = scripturePassage.trim();
    if (!ref) {
      toast.error(SOLO_SCRIPTURE_REF_HINT);
      return;
    }
    setPassageLoading(true);
    setPassageLoadError(null);
    void (async () => {
      const { rows, parseError } = await loadVersesForRef(ref);
      setPassageLoading(false);
      if (parseError) {
        setPassageVerses([]);
        setPassageLoadError(parseError);
        toast.error(parseError);
        setLastLoadedInput(null);
        return;
      }
      setPassageVerses(rows);
      setPassageLoadError(null);
      setLastLoadedInput(ref);
    })();
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
    queueMicrotask(() => {
      setWeek(initial.week);
      setScripturePassage(effectiveThirdsPersonalPassageRef(initial.week));
      setObsLike(initial.week.observation_like);
      setObsDiff(initial.week.observation_difficult);
      setObsPpl(initial.week.observation_teaches_people);
      setObsGod(initial.week.observation_teaches_god);
      const s = buildSuggestedLookForward(
        {
          obedience_statement: initial.week.obedience_statement,
          sharing_commitment: initial.week.sharing_commitment,
          train_commitment: initial.week.train_commitment,
          prior_obedience_done: initial.week.prior_obedience_done,
          prior_sharing_done: initial.week.prior_sharing_done,
          prior_train_done: initial.week.prior_train_done,
        },
        initial.priorFinalized
      );
      setObedience(initial.week.obedience_statement || s.obedience_statement);
      setSharing(initial.week.sharing_commitment || s.sharing_commitment);
      setTrain(initial.week.train_commitment || s.train_commitment);
    });
  }, [initial]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const onSaveLookBack = () => {
    startTransition(async () => {
      const r = await saveThirdsPersonalLookBack({
        priorObedienceDone: week.prior_obedience_done,
        priorSharingDone: week.prior_sharing_done,
        priorTrainDone: week.prior_train_done,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Look Back saved");
        refresh();
      }
    });
  };

  const onSaveLookUp = () => {
    if (!scripturePassage.trim()) {
      toast.error(SOLO_SCRIPTURE_REF_HINT);
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
        refresh();
      }
    });
  };

  const onSaveLookForward = () => {
    startTransition(async () => {
      const r = await saveThirdsPersonalLookForward({
        obedienceStatement: obedience,
        sharingCommitment: sharing,
        trainCommitment: train,
      });
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Look Forward saved");
        refresh();
      }
    });
  };

  const onFinalize = () => {
    startTransition(async () => {
      const r = await finalizeThirdsPersonalWeek();
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Complete 3/3 saved — your week is finalized.");
        refresh();
      }
    });
  };

  const onGroupComplete = () => {
    startTransition(async () => {
      const r = await recordThirdsPersonalGroupComplete();
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Complete 3/3 recorded for this pillar week.");
        refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Week of {initial.currentWeekMondayYmd} (UTC)
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">Solo 3/3rds</h1>
        </div>
        {readOnly ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            This week is finalized
          </span>
        ) : null}
      </div>

      <ThreeThirdsStepper activeSection={section} onSectionChange={setSection} />

      {section === 1 && (
        <section className={cn(meetingSectionPadding, "space-y-4")}>
          <div className="rounded-lg border border-[color:var(--color-lookback)]/25 bg-[color:var(--color-lookback-bg)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[color:var(--color-lookback)]">Look Back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check off each commitment you kept from your last finalized week. Anything left
              unchecked stays in front of you in Look Forward.
            </p>
          </div>
          {!priorFinalized ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a prior finalized solo week yet. After you complete your first
              week, accountability checkboxes will show here.
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
                <Button type="button" onClick={onSaveLookBack} disabled={pending}>
                  Save Look Back
                </Button>
              ) : null}
            </div>
          )}
        </section>
      )}

      {section === 2 && (
        <section className={cn(meetingSectionPadding, "space-y-4")}>
          <div className="rounded-lg border border-sky-200/60 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20">
            <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">Look Up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Type a reference, tap <span className="font-medium text-foreground">Load Passage</span>{" "}
              to read the WEB text here, then answer the four observation prompts.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-4")}>
            <div className="space-y-2">
              <Label htmlFor="solo-scripture-passage" className="text-base font-medium">
                Scripture Passage
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
                    onClick={onLoadPassage}
                    disabled={pending || passageLoading}
                  >
                    {passageLoading ? "Loading…" : "Load Passage"}
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
                        <sup className="mr-1 font-mono text-[11px] text-muted-foreground">
                          {v.verse}
                        </sup>
                        {v.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={meetingYourLabel}>What do you like about this passage?</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsLike}
                disabled={readOnly}
                onChange={(e) => setObsLike(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>What seems difficult?</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsDiff}
                disabled={readOnly}
                onChange={(e) => setObsDiff(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>What does it teach about people?</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsPpl}
                disabled={readOnly}
                onChange={(e) => setObsPpl(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className={meetingYourLabel}>What does it teach about God?</Label>
              <Textarea
                className={meetingTextareaClass()}
                value={obsGod}
                disabled={readOnly}
                onChange={(e) => setObsGod(e.target.value)}
                rows={3}
              />
            </div>
            {!readOnly ? (
              <Button type="button" onClick={onSaveLookUp} disabled={pending}>
                Save Look Up
              </Button>
            ) : null}
          </div>
        </section>
      )}

      {section === 3 && (
        <section className={cn(meetingSectionPadding, "space-y-4")}>
          <div className="rounded-lg border border-[color:var(--color-lookforward)]/35 bg-[color:var(--color-lookforward-bg)] px-4 py-3">
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Look Forward
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Obey · Share · Train — carry-forward lines appear from unchecked Look Back items.
            </p>
          </div>
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
                <Button type="button" variant="secondary" onClick={onSaveLookForward} disabled={pending}>
                  Save Look Forward
                </Button>
                <Button type="button" onClick={onFinalize} disabled={pending}>
                  Complete 3/3
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Complete 3/3 saves your week and counts this pillar week toward your 3/3 weekly streak
              (requires scripture passage, all four Look Up lines, and obey / share / train).
            </p>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <h3 className="text-sm font-medium text-foreground">Informal group finished?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When an off-app 3/3rds group wraps up, tap Complete 3/3 to record this pillar week for
          your streak. Solo participation above still uses the same weekly tracker.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onGroupComplete}
          disabled={pending}
        >
          Complete 3/3 (informal group)
        </Button>
      </div>
    </div>
  );
}
