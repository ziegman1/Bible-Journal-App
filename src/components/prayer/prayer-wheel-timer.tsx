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
import { playPrayerWheelBell } from "@/components/prayer/play-prayer-bell";
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

  const advanceAfterSuccessfulSave = useCallback(
    (completedStep: number) => {
      if (completedStep < 11) {
        setCurrentStep(completedStep + 1);
        setSegmentEndTime(Date.now() + minutesPerSegment * 60 * 1000);
      } else {
        setPhase("complete");
        setSegmentEndTime(null);
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
      try {
        playPrayerWheelBell();
        const res = await recordPrayerWheelSegment(completedStep, minutesPerSegment);
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
    if (phase !== "running" || segmentEndTime == null) return;

    const tick = () => {
      const sec = Math.max(0, Math.ceil((segmentEndTime - Date.now()) / 1000));
      setSecondsLeft(sec);
      if (Date.now() >= segmentEndTime && !finishingRef.current) {
        void persistAndAdvance(currentStep);
      }
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
    setSegmentEndTime(Date.now() + minutesPerSegment * 60 * 1000);
    setSecondsLeft(minutesPerSegment * 60);
  }

  function stopSession() {
    setPhase("setup");
    setSegmentEndTime(null);
    setCurrentStep(0);
    setSecondsLeft(0);
    setSaveError(null);
    setFailedStep(null);
  }

  async function retrySave() {
    if (failedStep == null) return;
    finishingRef.current = true;
    try {
      const res = await recordPrayerWheelSegment(failedStep, minutesPerSegment);
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={retrySave}>
                      Retry save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={stopSession}>
                      End session
                    </Button>
                  </div>
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
