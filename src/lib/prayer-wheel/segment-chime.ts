/**
 * Soft meditation-style bell for Prayer Wheel segment transitions.
 * Prefers `/public/audio/prayer-bell.mp3` when present; otherwise synthesizes a low, gentle tone
 * with a slow attack and long decay (no alert-like beeps).
 */

const PRAYER_BELL_SRC = "/audio/prayer-bell.mp3";
/** Total window for file playback before reset (matches ~3–4s target content). */
const FILE_CUTOFF_MS = 4000;
const FILE_VOLUME = 0.22;

const ATTACK_S = 0.17;
const DECAY_S = 3.25;
/** Master peak; kept low so the chime stays in the background. */
const SYNTH_PEAK = 0.2;

/** Low partials only — avoids piercing / “notification” highs. */
const SYNTH_PARTIALS: readonly { hz: number; weight: number }[] = [
  { hz: 185, weight: 1 },
  { hz: 277, weight: 0.42 },
  { hz: 350, weight: 0.14 },
];

let fileAudio: HTMLAudioElement | null = null;
let fileUnavailable = false;
let fileStopTimer: number | null = null;

let synthCtx: AudioContext | null = null;
type SynthActive = {
  oscillators: OscillatorNode[];
  master: GainNode;
};
let synthActive: SynthActive | null = null;
let synthCleanupTimer: number | null = null;

function clearFileStopTimer(): void {
  if (fileStopTimer != null) {
    window.clearTimeout(fileStopTimer);
    fileStopTimer = null;
  }
}

function clearSynthCleanupTimer(): void {
  if (synthCleanupTimer != null) {
    window.clearTimeout(synthCleanupTimer);
    synthCleanupTimer = null;
  }
}

function teardownSynth(): void {
  clearSynthCleanupTimer();
  if (!synthActive) return;
  for (const o of synthActive.oscillators) {
    try {
      o.stop();
    } catch {
      /* already stopped */
    }
    try {
      o.disconnect();
    } catch {
      /* ignore */
    }
  }
  try {
    synthActive.master.disconnect();
  } catch {
    /* ignore */
  }
  synthActive = null;
}

function ensureFileElement(): HTMLAudioElement {
  if (!fileAudio) {
    const el = new Audio(PRAYER_BELL_SRC);
    el.preload = "auto";
    el.volume = FILE_VOLUME;
    el.addEventListener(
      "error",
      () => {
        fileUnavailable = true;
      },
      { passive: true }
    );
    fileAudio = el;
  }
  return fileAudio;
}

function playSyntheticBell(): void {
  teardownSynth();
  if (typeof window === "undefined") return;

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;

  try {
    if (!synthCtx) synthCtx = new Ctx();
    const ctx = synthCtx;
    void ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.connect(ctx.destination);

    const t0 = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(SYNTH_PEAK, t0 + ATTACK_S);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + ATTACK_S + DECAY_S);

    const wSum = SYNTH_PARTIALS.reduce((s, p) => s + p.weight, 0);
    const oscillators: OscillatorNode[] = [];

    for (const { hz, weight } of SYNTH_PARTIALS) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = hz;
      const stem = ctx.createGain();
      stem.gain.value = (weight / wSum) * 0.92;
      osc.connect(stem);
      stem.connect(master);
      const stopAt = t0 + ATTACK_S + DECAY_S + 0.08;
      osc.start(t0);
      osc.stop(stopAt);
      oscillators.push(osc);
    }

    synthActive = { oscillators, master };

    const cleanupMs = Math.ceil((ATTACK_S + DECAY_S + 0.15) * 1000);
    synthCleanupTimer = window.setTimeout(() => {
      synthCleanupTimer = null;
      teardownSynth();
    }, cleanupMs);
  } catch {
    /* Web Audio unavailable */
  }
}

function playFileBell(): void {
  if (fileUnavailable) {
    playSyntheticBell();
    return;
  }
  const el = ensureFileElement();
  clearFileStopTimer();
  el.pause();
  el.currentTime = 0;
  el.volume = FILE_VOLUME;

  const p = el.play();
  if (p !== undefined) {
    void p.catch(() => {
      fileUnavailable = true;
      clearFileStopTimer();
      if (fileAudio) {
        fileAudio.pause();
        fileAudio.currentTime = 0;
      }
      playSyntheticBell();
    });
  }

  fileStopTimer = window.setTimeout(() => {
    fileStopTimer = null;
    el.pause();
    el.currentTime = 0;
  }, FILE_CUTOFF_MS);
}

/**
 * Stops any in-progress segment chime (file or synthesized). Call when resetting the wheel
 * or when starting a new transition so rapid segment changes do not stack.
 */
export function stopPrayerWheelSegmentChime(): void {
  clearFileStopTimer();
  if (fileAudio) {
    fileAudio.pause();
    fileAudio.currentTime = 0;
  }
  teardownSynth();
}

/**
 * One gentle bell strike: no loop. Restarts cleanly if called again while a chime is playing.
 */
export function playPrayerWheelSegmentChime(): void {
  if (typeof window === "undefined") return;
  stopPrayerWheelSegmentChime();

  if (fileUnavailable) {
    playSyntheticBell();
    return;
  }

  playFileBell();
}
