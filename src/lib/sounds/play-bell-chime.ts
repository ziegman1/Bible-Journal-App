const BELL_SRC = "/sounds/bell.mp3";
const STOP_AFTER_MS = 3000;

let bellAudio: HTMLAudioElement | null = null;
/** Browser timer id (avoid Node `Timeout` typing in shared TS config). */
let stopTimer: number | null = null;

/**
 * Plays the bell MP3 from `/public/sounds/bell.mp3`.
 * - Starts playback immediately (after `currentTime` reset).
 * - Stops and resets after 3 seconds so the element is ready to replay.
 * - A new call while playing clears the previous stop timer and restarts cleanly (no overlap).
 * - `play()` failures (e.g. autoplay before user gesture) are swallowed; call again after interaction.
 */
export function playBellChime(): void {
  if (typeof window === "undefined") return;

  if (stopTimer != null) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }

  if (!bellAudio) {
    bellAudio = new Audio(BELL_SRC);
    bellAudio.preload = "auto";
  }

  bellAudio.pause();
  bellAudio.currentTime = 0;

  const p = bellAudio.play();
  if (p !== undefined) {
    void p.catch(() => {
      /* Autoplay policy or missing file */
    });
  }

  stopTimer = window.setTimeout(() => {
    stopTimer = null;
    if (!bellAudio) return;
    bellAudio.pause();
    bellAudio.currentTime = 0;
  }, STOP_AFTER_MS);
}
