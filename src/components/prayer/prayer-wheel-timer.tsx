"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordPrayerWheelSegment } from "@/app/actions/prayer-wheel";
import { PRAYER_WHEEL_STEPS } from "@/lib/prayer-wheel/steps";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { playBellChime } from "@/lib/sounds/play-bell-chime";
import { PrayerWheelSvg } from "@/components/prayer/prayer-wheel-svg";
import { cn } from "@/lib/utils";

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PrayerWheelTimer() {
  const [phase, setPhase] = useState<"setup" | "running" | "complete" | "save_error">("setup");
  const [minutesPerSegment, setMinutesPerSegment] = useState(5);
  const [currentStep, setCurrentStep] = useState(0);
  const [segmentEndTime, setSegmentEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<number | null>(null);

  const finishingRef = useRef(false);
  /** Wall-clock start of the current segment (for logging actual minutes, not just the picker value). */
  const segmentWallStartMsRef = useRef<number | null>(null);
  /**
   * Prevents the interval from calling persist many times for the same segment deadline
   * (finishingRef clears in `finally` before React swaps in the next `segmentEndTime`).
   */
  const expiryHandledForDeadlineRef = useRef<number | null>(null);

  function actualMinutesForCurrentSegment(fallbackMinutes: number): number {
    const start = segmentWallStartMsRef.current;
    if (start == null) return fallbackMinutes;
    const elapsedMs = Date.now() - start;
    const m = Math.round(elapsedMs / 60000);
    return Math.min(15, Math.max(1, m || 1));
  }

  const advanceAfterSuccessfulSave = useCallback(
    (completedStep: number) => {
      if (completedStep < 11) {
        setCurrentStep(completedStep + 1);
        setSegmentEndTime(Date.now() + minutesPerSegment * 60 * 1000);
        segmentWallStartMsRef.current = Date.now();
      } else {
        setPhase("complete");
        setSegmentEndTime(null);
        segmentWallStartMsRef.current = null;
      }
      setSaveError(null);
      setFailedStep(null);
    },
    [minutesPerSegment]
  );

  const persistAndAdvance = useCallback(
    async (completedStep: number) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      const loggedMinutes = actualMinutesForCurrentSegment(minutesPerSegment);
      try {
        playBellChime();
        const res = await recordPrayerWheelSegment(completedStep, loggedMinutes);
        if ("error" in res) {
          setSaveError(res.error);
          setFailedStep(completedStep);
          setPhase("save_error");
          setSegmentEndTime(null);
          return;
        }
        advanceAfterSuccessfulSave(completedStep);
      } finally {
        finishingRef.current = false;
      }
    },
    [advanceAfterSuccessfulSave, minutesPerSegment]
  );

  useEffect(() => {
    expiryHandledForDeadlineRef.current = null;
  }, [segmentEndTime]);

  useEffect(() => {
    if (phase !== "running" || segmentEndTime == null) return;

    const tick = () => {
      const sec = Math.max(0, Math.ceil((segmentEndTime - Date.now()) / 1000));
      setSecondsLeft(sec);
      const deadline = segmentEndTime;
      if (Date.now() < deadline || finishingRef.current) return;
      if (expiryHandledForDeadlineRef.current === deadline) return;
      expiryHandledForDeadlineRef.current = deadline;
      void persistAndAdvance(currentStep);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, segmentEndTime, currentStep, persistAndAdvance]);

  function startSession() {
    setSaveError(null);
    setFailedStep(null);
    setCurrentStep(0);
    setPhase("running");
    const now = Date.now();
    segmentWallStartMsRef.current = now;
    setSegmentEndTime(now + minutesPerSegment * 60 * 1000);
    setSecondsLeft(minutesPerSegment * 60);
  }

  function stopSession() {
    if (
      phase === "running" &&
      segmentWallStartMsRef.current != null &&
      segmentEndTime != null &&
      expiryHandledForDeadlineRef.current !== segmentEndTime
    ) {
      const elapsedMs = Date.now() - segmentWallStartMsRef.current;
      if (elapsedMs >= 30000) {
        const partialMin = Math.min(15, Math.max(1, Math.round(elapsedMs / 60000) || 1));
        void recordPrayerWheelSegment(currentStep, partialMin);
      }
    }
    setPhase("setup");
    setSegmentEndTime(null);
    setCurrentStep(0);
    setSecondsLeft(0);
    setSaveError(null);
    setFailedStep(null);
    segmentWallStartMsRef.current = null;
    expiryHandledForDeadlineRef.current = null;
  }

  async function retrySave() {
    if (failedStep == null) return;
    finishingRef.current = true;
    try {
      const res = await recordPrayerWheelSegment(
        failedStep,
        actualMinutesForCurrentSegment(minutesPerSegment)
      );
      if ("error" in res) {
        setSaveError(res.error);
        return;
      }
      setPhase("running");
      advanceAfterSuccessfulSave(failedStep);
      if (failedStep < 11) {
        setSecondsLeft(minutesPerSegment * 60);
      }
    } finally {
      finishingRef.current = false;
    }
  }

  /** Advance the wheel when the DB is unavailable (e.g. migration not applied). Stats are not recorded. */
  function continueWithoutSaving() {
    if (failedStep == null) return;
    advanceAfterSuccessfulSave(failedStep);
    if (failedStep < 11) {
      setPhase("running");
      setSecondsLeft(minutesPerSegment * 60);
    }
  }

  const missingTableHint =
    saveError &&
    (saveError.includes("prayer_wheel_segment_completions") ||
      saveError.toLowerCase().includes("schema cache"));

  const displayStepIndex = phase === "save_error" && failedStep != null ? failedStep : currentStep;
  const displayStep = PRAYER_WHEEL_STEPS[displayStepIndex];

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="flex flex-col items-center justify-center gap-4">
          <PrayerWheelSvg
            activeIndex={
              phase === "running" || phase === "save_error" ? displayStepIndex : null
            }
          />
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            Twelve equal segments. Pick how long each one runs (1–15 minutes). A chime plays when a
            segment ends.
          </p>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          {phase === "setup" && (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-serif font-light text-foreground">Begin session</h2>
                <p className="text-sm text-muted-foreground">
                  Total time: {12 * minutesPerSegment} minutes for a full wheel (
                  {minutesPerSegment} min × 12).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-minutes">Minutes per segment</Label>
                <Select
                  value={String(minutesPerSegment)}
                  onValueChange={(v) => {
                    if (v) setMinutesPerSegment(parseInt(v, 10));
                  }}
                >
                  <SelectTrigger id="pw-minutes" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} minute{n === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="lg" onClick={startSession}>
                Start prayer wheel
              </Button>
            </>
          )}

          {(phase === "running" || phase === "save_error") && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Step {displayStepIndex + 1} of 12
                </p>
                <p
                  className={cn(
                    "font-mono text-3xl tabular-nums text-foreground",
                    phase === "save_error" && "opacity-40"
                  )}
                >
                  {formatMmSs(secondsLeft)}
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-light text-foreground">
                  {displayStep.title}
                </h3>
                <p className="text-sm text-muted-foreground">{displayStep.description}</p>
                <p className="pt-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                  {displayStep.reference}
                </p>
              </div>

              {phase === "save_error" && saveError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <p className="font-medium">Could not save this segment</p>
                  <p className="mt-1 text-destructive/90">{saveError}</p>
                  {missingTableHint ? (
                    <p className="mt-2 text-xs leading-relaxed text-destructive/80">
                      Your Supabase project is missing the Prayer Wheel table. In the Supabase
                      dashboard for this app, open SQL Editor and run the migration file{" "}
                      <span className="font-mono text-[11px]">038_prayer_wheel_segment_completions.sql</span>{" "}
                      from the repo (or run{" "}
                      <span className="font-mono text-[11px]">supabase db push</span>
                      ). After that, Retry save will work and the dashboard can track your time.
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={retrySave}>
                      Retry save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={continueWithoutSaving}>
                      Continue without saving
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={stopSession}>
                      End session
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Continue without saving keeps your prayer flow going; that segment won&apos;t count
                    toward weekly stats until the database is set up.
                  </p>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={stopSession}>
                  Stop session
                </Button>
              )}
            </>
          )}

          {phase === "complete" && (
            <div className="space-y-4">
              <h2 className="text-lg font-serif font-light text-foreground">Wheel complete</h2>
              <p className="text-sm text-muted-foreground">
                You finished all twelve segments ({12 * minutesPerSegment} minutes). Your time is
                counted toward this week&apos;s prayer stats on the home dashboard.
              </p>
              <Button type="button" onClick={stopSession}>
                Start another session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
