"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { recordPrayerWheelSegment } from "@/app/actions/prayer-wheel";
import { PRAYER_WHEEL_STEPS } from "@/lib/prayer-wheel/steps";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  playPrayerWheelSegmentChime,
  primePrayerWheelChimeAudio,
  stopPrayerWheelSegmentChime,
} from "@/lib/prayer-wheel/segment-chime";
import {
  DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE,
  DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME,
  PRAYER_WHEEL_BG_MUSIC_OPTIONS,
  readPrayerWheelBgMusicMode,
  readPrayerWheelBgMusicVolume,
  resumePrayerWheelBackgroundAudioFromUserGesture,
  stopPrayerWheelBackgroundAudio,
  syncPrayerWheelBackgroundAudio,
  writePrayerWheelBgMusicMode,
  writePrayerWheelBgMusicVolume,
  type PrayerWheelBgMusicMode,
} from "@/lib/prayer-wheel/background-music";
import {
  cancelPrayerWheelSpeech,
  DEFAULT_PRAYER_WHEEL_TRANSITION_MODE,
  PRAYER_WHEEL_TRANSITION_MODES,
  primePrayerWheelSpeechSynthesis,
  readPrayerWheelTransitionMode,
  resolveEffectiveTransitionMode,
  speakPrayerWheelSegmentPrompt,
  speechSynthesisSupported,
  writePrayerWheelTransitionMode,
  type PrayerWheelTransitionMode,
} from "@/lib/prayer-wheel/transition-prompt";
import { PrayerWheelSvg } from "@/components/prayer/prayer-wheel-svg";
import {
  prayerWheelCompleteCopy,
  prayerWheelSaveErrorWeeklyHint,
} from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PrayerWheelTimer({ copyTone = "accountability" }: { copyTone?: GrowthCopyTone }) {
  const [phase, setPhase] = useState<"setup" | "running" | "complete" | "save_error">("setup");
  const [minutesPerSegment, setMinutesPerSegment] = useState(5);
  const [currentStep, setCurrentStep] = useState(0);
  const [segmentEndTime, setSegmentEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<number | null>(null);
  const [transitionMode, setTransitionMode] = useState<PrayerWheelTransitionMode>(
    () =>
      typeof window !== "undefined"
        ? readPrayerWheelTransitionMode()
        : DEFAULT_PRAYER_WHEEL_TRANSITION_MODE
  );
  const [bgMusicMode, setBgMusicMode] = useState<PrayerWheelBgMusicMode>(() =>
    typeof window !== "undefined"
      ? readPrayerWheelBgMusicMode()
      : DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE
  );
  const [musicVolume, setMusicVolume] = useState(() =>
    typeof window !== "undefined"
      ? readPrayerWheelBgMusicVolume()
      : DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME
  );
  const [timerPaused, setTimerPaused] = useState(false);
  const [voiceDuck, setVoiceDuck] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);

  const finishingRef = useRef(false);
  /** Wall-clock start of the current segment (for logging actual minutes, not just the picker value). */
  const segmentWallStartMsRef = useRef<number | null>(null);
  /**
   * Prevents the interval from calling persist many times for the same segment deadline
   * (finishingRef clears in `finally` before React swaps in the next `segmentEndTime`).
   */
  const expiryHandledForDeadlineRef = useRef<number | null>(null);
  const speechAfterChimeTimerRef = useRef<number | null>(null);
  /** Remaining segment ms when the timer is paused (wall clock frozen). */
  const remainingMsRef = useRef<number | null>(null);

  useEffect(() => {
    setClientMounted(true);
  }, []);

  useEffect(() => {
    syncPrayerWheelBackgroundAudio({
      sessionActive: phase === "running",
      timerPaused,
      mode: bgMusicMode,
      volume01: musicVolume,
      duckForVoice: voiceDuck,
    });
  }, [phase, timerPaused, bgMusicMode, musicVolume, voiceDuck]);

  useEffect(() => {
    return () => stopPrayerWheelBackgroundAudio();
  }, []);

  const clearSpeechAfterChimeTimer = useCallback(() => {
    if (speechAfterChimeTimerRef.current != null) {
      window.clearTimeout(speechAfterChimeTimerRef.current);
      speechAfterChimeTimerRef.current = null;
    }
  }, []);

  const stopAllTransitionAudio = useCallback(() => {
    clearSpeechAfterChimeTimer();
    stopPrayerWheelSegmentChime();
    cancelPrayerWheelSpeech();
    setVoiceDuck(false);
  }, [clearSpeechAfterChimeTimer]);

  /** Unmount-only: do not depend on stopAllTransitionAudio (avoids accidental cleanup re-runs). */
  useEffect(() => {
    return () => {
      if (speechAfterChimeTimerRef.current != null) {
        window.clearTimeout(speechAfterChimeTimerRef.current);
        speechAfterChimeTimerRef.current = null;
      }
      stopPrayerWheelSegmentChime();
      cancelPrayerWheelSpeech();
    };
  }, []);

  const playSegmentEndPrompts = useCallback(
    (completedStep: number) => {
      stopAllTransitionAudio();
      const effective = resolveEffectiveTransitionMode(transitionMode);
      const hasNext = completedStep < 11;
      const nextTitle = hasNext
        ? PRAYER_WHEEL_STEPS[completedStep + 1]!.title
        : "";

      if (process.env.NODE_ENV === "development") {
        console.info("[PrayerWheel transition]", {
          completedStep,
          transitionMode,
          effective,
          hasNext,
          nextTitle,
          speechSupported: speechSynthesisSupported(),
        });
      }

      if (effective === "chime_only") {
        playPrayerWheelSegmentChime();
        return;
      }

      if (effective === "voice_only") {
        if (hasNext && speechSynthesisSupported()) {
          const restore = () => setVoiceDuck(false);
          setVoiceDuck(true);
          speakPrayerWheelSegmentPrompt(nextTitle, { onEnd: restore, onError: restore });
        } else {
          playPrayerWheelSegmentChime();
        }
        return;
      }

      playPrayerWheelSegmentChime();
      if (hasNext && speechSynthesisSupported()) {
        speechAfterChimeTimerRef.current = window.setTimeout(() => {
          speechAfterChimeTimerRef.current = null;
          const restore = () => setVoiceDuck(false);
          setVoiceDuck(true);
          speakPrayerWheelSegmentPrompt(nextTitle, { onEnd: restore, onError: restore });
        }, 850);
      }
    },
    [stopAllTransitionAudio, transitionMode]
  );

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
        setTimerPaused(false);
        remainingMsRef.current = null;
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
        const res = await recordPrayerWheelSegment(completedStep, loggedMinutes);
        /**
         * After await: defer chime/voice to the next macrotask so RSC refresh/revalidation cannot
         * unmount this component before audio starts (see prayer-wheel action: no /app/prayer revalidate).
         * On success, play prompts then advance in the same task so React can batch voiceDuck + step.
         */
        if ("error" in res) {
          window.setTimeout(() => {
            playSegmentEndPrompts(completedStep);
          }, 0);
          setSaveError(res.error);
          setFailedStep(completedStep);
          setPhase("save_error");
          setSegmentEndTime(null);
          setTimerPaused(false);
          remainingMsRef.current = null;
          return;
        }
        window.setTimeout(() => {
          playSegmentEndPrompts(completedStep);
          advanceAfterSuccessfulSave(completedStep);
        }, 0);
      } finally {
        finishingRef.current = false;
      }
    },
    [advanceAfterSuccessfulSave, minutesPerSegment, playSegmentEndPrompts]
  );

  useEffect(() => {
    expiryHandledForDeadlineRef.current = null;
  }, [segmentEndTime]);

  useEffect(() => {
    if (phase !== "running" || segmentEndTime == null) return;

    const tick = () => {
      if (timerPaused) {
        const frozen = remainingMsRef.current;
        if (frozen != null) {
          setSecondsLeft(Math.max(0, Math.ceil(frozen / 1000)));
        }
        return;
      }
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
  }, [phase, segmentEndTime, currentStep, persistAndAdvance, timerPaused]);

  function startSession() {
    stopAllTransitionAudio();
    primePrayerWheelSpeechSynthesis();
    primePrayerWheelChimeAudio();
    setSaveError(null);
    setFailedStep(null);
    setCurrentStep(0);
    setTimerPaused(false);
    remainingMsRef.current = null;
    setPhase("running");
    const now = Date.now();
    segmentWallStartMsRef.current = now;
    setSegmentEndTime(now + minutesPerSegment * 60 * 1000);
    setSecondsLeft(minutesPerSegment * 60);
    syncPrayerWheelBackgroundAudio({
      sessionActive: true,
      timerPaused: false,
      mode: bgMusicMode,
      volume01: musicVolume,
      duckForVoice: false,
    });
    resumePrayerWheelBackgroundAudioFromUserGesture();
  }

  function pauseTimer() {
    if (phase !== "running" || timerPaused || segmentEndTime == null) return;
    remainingMsRef.current = Math.max(0, segmentEndTime - Date.now());
    setTimerPaused(true);
  }

  function resumeTimer() {
    if (!timerPaused || remainingMsRef.current == null) return;
    const r = remainingMsRef.current;
    remainingMsRef.current = null;
    setSegmentEndTime(Date.now() + r);
    setTimerPaused(false);
    syncPrayerWheelBackgroundAudio({
      sessionActive: phase === "running",
      timerPaused: false,
      mode: bgMusicMode,
      volume01: musicVolume,
      duckForVoice: voiceDuck,
    });
    resumePrayerWheelBackgroundAudioFromUserGesture();
    primePrayerWheelSpeechSynthesis();
    primePrayerWheelChimeAudio();
  }

  function stopSession() {
    stopAllTransitionAudio();
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
    setTimerPaused(false);
    remainingMsRef.current = null;
    segmentWallStartMsRef.current = null;
    expiryHandledForDeadlineRef.current = null;
    stopPrayerWheelBackgroundAudio();
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
      setTimerPaused(false);
      remainingMsRef.current = null;
      setPhase("running");
      advanceAfterSuccessfulSave(failedStep);
      syncPrayerWheelBackgroundAudio({
        sessionActive: failedStep < 11,
        timerPaused: false,
        mode: bgMusicMode,
        volume01: musicVolume,
        duckForVoice: voiceDuck,
      });
      resumePrayerWheelBackgroundAudioFromUserGesture();
      primePrayerWheelSpeechSynthesis();
      primePrayerWheelChimeAudio();
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
    setTimerPaused(false);
    remainingMsRef.current = null;
    advanceAfterSuccessfulSave(failedStep);
    if (failedStep < 11) {
      setPhase("running");
      setSecondsLeft(minutesPerSegment * 60);
    }
    syncPrayerWheelBackgroundAudio({
      sessionActive: failedStep < 11,
      timerPaused: false,
      mode: bgMusicMode,
      volume01: musicVolume,
      duckForVoice: voiceDuck,
    });
    resumePrayerWheelBackgroundAudioFromUserGesture();
    primePrayerWheelSpeechSynthesis();
    primePrayerWheelChimeAudio();
  }

  const missingTableHint =
    saveError &&
    (saveError.includes("prayer_wheel_segment_completions") ||
      saveError.toLowerCase().includes("schema cache"));

  const displayStepIndex = phase === "save_error" && failedStep != null ? failedStep : currentStep;
  const displayStep = PRAYER_WHEEL_STEPS[displayStepIndex];

  const transitionModeSelector = (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 dark:bg-muted/20">
      <Label htmlFor="pw-transition-mode" className="text-foreground">
        When a segment ends
      </Label>
      <Select
        value={transitionMode}
        onValueChange={(v) => {
          if (
            v === "chime_only" ||
            v === "voice_only" ||
            v === "chime_and_voice"
          ) {
            setTransitionMode(v);
            writePrayerWheelTransitionMode(v);
          }
        }}
      >
        <SelectTrigger
          id="pw-transition-mode"
          className="w-full max-w-md border-border bg-background text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRAYER_WHEEL_TRANSITION_MODES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs leading-snug text-muted-foreground">
        Voice says: “Now spend time in …” using the next segment title (e.g. Praise, Confession).
        Chime + voice plays the bell first, then speaks.
      </p>
      {clientMounted &&
      !speechSynthesisSupported() &&
      (transitionMode === "voice_only" ||
        transitionMode === "chime_and_voice") ? (
        <p className="text-xs leading-snug text-amber-800 dark:text-amber-200/90">
          This browser does not support speech synthesis. You will hear the chime only.
        </p>
      ) : null}
      {process.env.NODE_ENV === "development" && clientMounted ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 border-dashed"
          onClick={() => {
            primePrayerWheelSpeechSynthesis();
            primePrayerWheelChimeAudio();
            speakPrayerWheelSegmentPrompt("Praise");
          }}
        >
          Test voice prompt (dev)
        </Button>
      ) : null}
    </div>
  );

  const bgMusicSelector = (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 dark:bg-muted/20">
      <Label htmlFor="pw-bg-music" className="text-foreground">
        Background music
      </Label>
      <Select
        value={bgMusicMode}
        onValueChange={(v) => {
          if (v === "off" || v === "ambient" || v === "hz444_ambient") {
            setBgMusicMode(v);
            writePrayerWheelBgMusicMode(v);
          }
        }}
      >
        <SelectTrigger
          id="pw-bg-music"
          className="w-full max-w-md border-border bg-background text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRAYER_WHEEL_BG_MUSIC_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="space-y-1.5">
        <Label htmlFor="pw-music-vol" className="text-foreground">
          Music volume
        </Label>
        <input
          id="pw-music-vol"
          type="range"
          min={0}
          max={100}
          step={1}
          disabled={bgMusicMode === "off"}
          value={Math.round(musicVolume * 100)}
          onChange={(e) => {
            const v = Math.min(1, Math.max(0, parseInt(e.target.value, 10) / 100));
            setMusicVolume(v);
            writePrayerWheelBgMusicVolume(v);
          }}
          className={cn(
            "h-2 w-full max-w-md cursor-pointer rounded-full bg-muted accent-violet-600 disabled:cursor-not-allowed disabled:opacity-50 dark:accent-violet-400"
          )}
        />
      </div>
      <p className="text-xs leading-snug text-muted-foreground">
        <strong className="font-medium text-foreground">Ambient music</strong> is the full looping MP3
        track. The last option is a <strong className="font-medium text-foreground">synthesized</strong>{" "}
        single-frequency tone (it will sound like a plain hum, not instrumental music). Audio pauses
        with the timer and stops when you end the session.
      </p>
    </div>
  );

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
            Twelve equal segments. Pick how long each one runs (1–15 minutes). At each transition you
            can use a chime, a short voice prompt, or both—see the setting on the right.
          </p>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          {transitionModeSelector}
          {bgMusicSelector}
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
                    {prayerWheelSaveErrorWeeklyHint(copyTone)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {timerPaused ? (
                    <Button type="button" variant="secondary" size="sm" onClick={resumeTimer}>
                      Resume
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={pauseTimer}>
                      Pause
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={stopSession}>
                    Stop session
                  </Button>
                </div>
              )}
            </>
          )}

          {phase === "complete" && (
            <div className="space-y-4">
              <h2 className="text-lg font-serif font-light text-foreground">Wheel complete</h2>
              <p className="text-sm text-muted-foreground">
                {prayerWheelCompleteCopy(copyTone, 12 * minutesPerSegment)}
              </p>
              <Button type="button" onClick={stopSession}>
                Start another session
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border border-dashed bg-muted/25 px-4 py-4">
        <h3 className="text-sm font-medium text-foreground">Prayer hour training</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Zúme Training walks through the twelve-step Prayer Cycle—an hour in prayer with the same
          kinds of movements as this wheel—with video and a read-along transcript.
        </p>
        <a
          href="https://zume.training/how-to-spend-an-hour-in-prayer"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-3 inline-flex items-center gap-2"
          )}
        >
          Open How to Spend an Hour in Prayer on Zúme
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
      </div>
    </div>
  );
}
