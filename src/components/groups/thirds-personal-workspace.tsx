"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getPresetStories } from "@/app/actions/meetings";
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
  formatThirdsPersonalPassageRef,
} from "@/lib/groups/thirds-personal-helpers";
import { BIBLE_BOOKS } from "@/lib/scripture/books";
import { fetchPassageVersesRangeInBrowser } from "@/lib/scripture/fetch-passage-verses-browser";
import { cn } from "@/lib/utils";

type PresetRow = {
  id: string;
  title: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
};

function passageModeFromWeek(w: ThirdsPersonalWorkspacePayload["week"]) {
  if (w.look_up_preset_story_id) return "preset" as const;
  if (
    w.look_up_book?.trim() &&
    w.look_up_chapter != null &&
    w.look_up_verse_start != null &&
    w.look_up_verse_end != null
  ) {
    return "manual" as const;
  }
  return "reference_only" as const;
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

export function ThirdsPersonalWorkspace({ initial }: { initial: ThirdsPersonalWorkspacePayload }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [section, setSection] = useState<1 | 2 | 3>(1);

  const [week, setWeek] = useState(initial.week);
  const [priorFinalized] = useState(initial.priorFinalized);

  const readOnly = Boolean(week.finalized_at);

  const [passageRef, setPassageRef] = useState(week.passage_ref);
  const [passageMode, setPassageMode] = useState(() => passageModeFromWeek(week));
  const [bySeries, setBySeries] = useState<Record<string, PresetRow[]>>({});
  const [selectedPresetId, setSelectedPresetId] = useState(
    () => week.look_up_preset_story_id ?? ""
  );
  const [book, setBook] = useState(() => week.look_up_book || "");
  const [chapter, setChapter] = useState(() =>
    week.look_up_chapter != null ? String(week.look_up_chapter) : ""
  );
  const [verseStart, setVerseStart] = useState(() =>
    week.look_up_verse_start != null ? String(week.look_up_verse_start) : ""
  );
  const [verseEnd, setVerseEnd] = useState(() =>
    week.look_up_verse_end != null ? String(week.look_up_verse_end) : ""
  );
  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string }[]>(
    () => initial.initialPassageVerses
  );
  const [passageLoading, setPassageLoading] = useState(false);
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

  useEffect(() => {
    getPresetStories().then((r) => {
      if ("error" in r) return;
      setBySeries((r.bySeries ?? {}) as Record<string, PresetRow[]>);
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setWeek(initial.week);
      setPassageRef(initial.week.passage_ref);
      setPassageMode(passageModeFromWeek(initial.week));
      setSelectedPresetId(initial.week.look_up_preset_story_id ?? "");
      setBook(initial.week.look_up_book || "");
      setChapter(
        initial.week.look_up_chapter != null ? String(initial.week.look_up_chapter) : ""
      );
      setVerseStart(
        initial.week.look_up_verse_start != null ? String(initial.week.look_up_verse_start) : ""
      );
      setVerseEnd(
        initial.week.look_up_verse_end != null ? String(initial.week.look_up_verse_end) : ""
      );
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
      setPassageVerses(initial.initialPassageVerses);
    });
  }, [initial]);

  useEffect(() => {
    if (passageMode !== "manual") return;
    const ch = parseInt(chapter, 10);
    const vs = parseInt(verseStart, 10);
    const ve = parseInt(verseEnd, 10);
    if (!book.trim() || !ch || !vs || !ve) return;
    queueMicrotask(() =>
      setPassageRef(formatThirdsPersonalPassageRef(book.trim(), ch, vs, ve))
    );
  }, [passageMode, book, chapter, verseStart, verseEnd]);

  useEffect(() => {
    if (passageMode === "reference_only") {
      queueMicrotask(() => {
        setPassageVerses([]);
        setPassageLoading(false);
      });
      return;
    }
    const bn = book.trim();
    const ch = parseInt(chapter, 10);
    const vsRaw = parseInt(verseStart, 10);
    const veRaw = parseInt(verseEnd, 10);
    if (
      !bn ||
      !Number.isFinite(ch) ||
      ch < 1 ||
      !Number.isFinite(vsRaw) ||
      vsRaw < 1 ||
      !Number.isFinite(veRaw) ||
      veRaw < 1
    ) {
      queueMicrotask(() => {
        setPassageVerses([]);
        setPassageLoading(false);
      });
      return;
    }
    const vs = vsRaw;
    const ve = veRaw;
    let cancelled = false;
    queueMicrotask(() => setPassageLoading(true));
    void fetchPassageVersesRangeInBrowser({
      book: bn,
      chapter: ch,
      verseStart: vs,
      verseEnd: ve,
    }).then((rows) => {
      if (!cancelled) {
        setPassageVerses(rows);
        setPassageLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [passageMode, book, chapter, verseStart, verseEnd]);

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
    if (passageMode === "preset" && !selectedPresetId.trim()) {
      toast.error("Select a preset story.");
      return;
    }
    if (passageMode === "manual") {
      const ch = parseInt(chapter, 10);
      const vs = parseInt(verseStart, 10);
      const ve = parseInt(verseEnd, 10);
      if (!book.trim() || !ch || !vs || !ve) {
        toast.error("Fill in book, chapter, and verse range.");
        return;
      }
    }
    startTransition(async () => {
      const ch = parseInt(chapter, 10);
      const vs = parseInt(verseStart, 10);
      const ve = parseInt(verseEnd, 10);
      const r = await saveThirdsPersonalLookUp({
        passageMode,
        presetStoryId: passageMode === "preset" ? selectedPresetId.trim() || null : null,
        book: book.trim(),
        chapter: Number.isFinite(ch) ? ch : null,
        verseStart: Number.isFinite(vs) ? vs : null,
        verseEnd: Number.isFinite(ve) ? ve : null,
        passageRef,
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

  const seriesNames = Object.keys(bySeries).sort();

  const applyPresetRow = useCallback((s: PresetRow) => {
    setSelectedPresetId(s.id);
    setPassageRef(
      formatThirdsPersonalPassageRef(s.book, s.chapter, s.verse_start, s.verse_end)
    );
    setBook(s.book);
    setChapter(String(s.chapter));
    setVerseStart(String(s.verse_start));
    setVerseEnd(String(s.verse_end));
  }, []);

  useEffect(() => {
    if (readOnly || passageMode !== "preset") return;
    if (selectedPresetId) return;
    const first = Object.values(bySeries).flat()[0];
    if (!first) return;
    queueMicrotask(() => applyPresetRow(first));
  }, [readOnly, passageMode, selectedPresetId, bySeries, applyPresetRow]);

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
              Choose a preset or custom passage to read the text here (same pattern as scheduling a
              group meeting), then answer the four observation prompts.
            </p>
          </div>
          <div className={cn(meetingYourRegion, "space-y-4")}>
            <div className="space-y-3">
              <Label>Passage</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Preset story or custom book / chapter / verses loads WEB text below for your Look Up
                time.
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="soloStorySource"
                    checked={passageMode === "preset"}
                    disabled={readOnly}
                    onChange={() => setPassageMode("preset")}
                  />
                  <span className="text-sm">Preset story</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="soloStorySource"
                    checked={passageMode === "manual"}
                    disabled={readOnly}
                    onChange={() => setPassageMode("manual")}
                  />
                  <span className="text-sm">Custom passage</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="soloStorySource"
                    checked={passageMode === "reference_only"}
                    disabled={readOnly}
                    onChange={() => setPassageMode("reference_only")}
                  />
                  <span className="text-sm">Reference only</span>
                </label>
              </div>

              {passageMode === "preset" && (
                <div className="mt-3 space-y-3">
                  {seriesNames.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading stories…</p>
                  ) : (
                    seriesNames.map((series) => (
                      <div key={series}>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{series}</p>
                        <div className="space-y-1">
                          {bySeries[series]?.map((s) => (
                            <label
                              key={s.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-muted/60"
                            >
                              <input
                                type="radio"
                                name="soloPreset"
                                checked={selectedPresetId === s.id}
                                disabled={readOnly}
                                onChange={() => applyPresetRow(s)}
                              />
                              <span className="text-sm">
                                {s.title} ({s.book} {s.chapter}:{s.verse_start}
                                {s.verse_start !== s.verse_end ? `–${s.verse_end}` : ""})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {passageMode === "manual" && (
                <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="col-span-2 md:col-span-1">
                    <Label>Book</Label>
                    <select
                      value={book}
                      disabled={readOnly}
                      onChange={(e) => setBook(e.target.value)}
                      className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {BIBLE_BOOKS.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Chapter</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1.5"
                      value={chapter}
                      disabled={readOnly}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Verse start</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1.5"
                      value={verseStart}
                      disabled={readOnly}
                      onChange={(e) => setVerseStart(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Verse end</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1.5"
                      value={verseEnd}
                      disabled={readOnly}
                      onChange={(e) => setVerseEnd(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Label htmlFor="passage-ref">
                  Passage reference{passageMode === "reference_only" ? "" : " (auto-filled; editable)"}
                </Label>
                <Input
                  id="passage-ref"
                  value={passageRef}
                  disabled={readOnly}
                  onChange={(e) => setPassageRef(e.target.value)}
                  placeholder="e.g. John 15:1–17"
                  className="font-medium"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/80 shadow-sm">
              <p className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                {passageRef.trim() || "Passage"}
              </p>
              <div className="max-h-72 overflow-y-auto px-3 py-3">
                {passageMode === "reference_only" ? (
                  <p className="text-sm text-muted-foreground">
                    Choose Preset or Custom passage to load scripture text here, or keep Reference
                    only if you are reading from a physical Bible.
                  </p>
                ) : passageLoading ? (
                  <p className="text-sm text-muted-foreground">Loading passage…</p>
                ) : passageVerses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No verses found for this range in the library. Adjust the passage or check your
                    scripture data (WEB).
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
              (requires passage, all four Look Up lines, and obey / share / train).
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
