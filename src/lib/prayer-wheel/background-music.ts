/**
 * Optional Prayer Wheel background audio: looped ambient MP3 or a 444 Hz–labeled sine tone.
 * No claims about frequency—UI presents it only as an optional ambient choice.
 */

export type PrayerWheelBgMusicMode = "off" | "ambient" | "hz444_ambient";

const MODE_KEY = "badwr.prayerWheel.bgMusicMode";
const VOLUME_KEY = "badwr.prayerWheel.bgMusicVolume";

/** Real ambient bed (loop=true; seamless loop depends on how the file was mastered). */
const AMBIENT_MP3_SRC = "/audio/prayer-ambient-1.mp3";

export const PRAYER_WHEEL_BG_MUSIC_OPTIONS: readonly {
  value: PrayerWheelBgMusicMode;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  /** Looped MP3 from `/public/audio/` — not the synthesized option below. */
  { value: "ambient", label: "Ambient music (recorded track)" },
  /** Single sine oscillator — will sound like a simple mono hum, not a full track. */
  {
    value: "hz444_ambient",
    label: "Steady tone — “444 Hz” label (synthesized)",
  },
];

export const DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE: PrayerWheelBgMusicMode = "off";
/** Slightly conservative default so the MP3 bed stays unobtrusive. */
export const DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME = 0.28;

const DUCK_MULT = 0.22;
const GAIN_RAMP_S = 0.04;

const LABELED_TONE_HZ = 444;
const HZ444_PER_OSC_GAIN = 0.07;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME;
  return Math.min(1, Math.max(0, n));
}

export function readPrayerWheelBgMusicMode(): PrayerWheelBgMusicMode {
  if (typeof window === "undefined") return DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE;
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === "off" || raw === "ambient" || raw === "hz444_ambient") return raw;
  } catch {
    /* private mode */
  }
  return DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE;
}

export function writePrayerWheelBgMusicMode(mode: PrayerWheelBgMusicMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* quota */
  }
}

export function readPrayerWheelBgMusicVolume(): number {
  if (typeof window === "undefined") return DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME;
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null) return DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME;
    const n = parseFloat(raw);
    return clamp01(n);
  } catch {
    return DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME;
  }
}

export function writePrayerWheelBgMusicVolume(volume01: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOLUME_KEY, String(clamp01(volume01)));
  } catch {
    /* quota */
  }
}

/** What is currently driving output (at most one of file vs Web Audio tone). */
type ActiveOutput = "none" | "ambient_file" | "hz444";

let activeOutput: ActiveOutput = "none";

let ambientAudio: HTMLAudioElement | null = null;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let hz444Osc: OscillatorNode | null = null;
let hz444Stem: GainNode | null = null;

function ensureAmbientAudio(): HTMLAudioElement {
  if (!ambientAudio) {
    const el = new Audio(AMBIENT_MP3_SRC);
    el.loop = true;
    el.preload = "auto";
    ambientAudio = el;
  }
  return ambientAudio;
}

function stopAmbientFile(): void {
  if (!ambientAudio) return;
  ambientAudio.pause();
  ambientAudio.currentTime = 0;
}

function teardownHz444(): void {
  if (hz444Osc) {
    try {
      hz444Osc.stop();
    } catch {
      /* already stopped */
    }
    try {
      hz444Osc.disconnect();
    } catch {
      /* ignore */
    }
    hz444Osc = null;
  }
  if (hz444Stem) {
    try {
      hz444Stem.disconnect();
    } catch {
      /* ignore */
    }
    hz444Stem = null;
  }
}

function ensureAudioContext(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioContext = new Ctx();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioContext.destination);
    }
    return { ctx: audioContext, master: masterGain! };
  } catch {
    return null;
  }
}

function startHz444(ctx: AudioContext, master: GainNode): void {
  teardownHz444();
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = LABELED_TONE_HZ;
  const g = ctx.createGain();
  g.gain.value = HZ444_PER_OSC_GAIN;
  osc.connect(g);
  g.connect(master);
  osc.start();
  hz444Osc = osc;
  hz444Stem = g;
}

function applyMasterGain(
  ctx: AudioContext,
  master: GainNode,
  volume01: number,
  duckForVoice: boolean
): void {
  const base = clamp01(volume01);
  const target = base * (duckForVoice ? DUCK_MULT : 1);
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(target, now, GAIN_RAMP_S);
}

function effectiveAmbientElementVolume(volume01: number, duckForVoice: boolean): number {
  return clamp01(volume01) * (duckForVoice ? DUCK_MULT : 1);
}

export type PrayerWheelBackgroundAudioSync = {
  sessionActive: boolean;
  timerPaused: boolean;
  mode: PrayerWheelBgMusicMode;
  volume01: number;
  duckForVoice: boolean;
};

/**
 * Single owner for Prayer Wheel background audio: one source at a time (file loop OR 444 Hz tone).
 */
export function syncPrayerWheelBackgroundAudio(s: PrayerWheelBackgroundAudioSync): void {
  if (typeof window === "undefined") return;

  if (!s.sessionActive || s.mode === "off") {
    stopAmbientFile();
    teardownHz444();
    activeOutput = "none";
    if (audioContext && masterGain) {
      try {
        applyMasterGain(audioContext, masterGain, 0, false);
      } catch {
        /* ignore */
      }
      void audioContext.suspend().catch(() => {});
    }
    return;
  }

  if (s.mode === "ambient") {
    teardownHz444();
    if (audioContext) {
      void audioContext.suspend().catch(() => {});
    }

    const el = ensureAmbientAudio();
    el.volume = effectiveAmbientElementVolume(s.volume01, s.duckForVoice);

    if (s.timerPaused) {
      el.pause();
    } else if (el.paused) {
      void el.play().catch(() => {
        /* autoplay / missing file */
      });
    }
    activeOutput = "ambient_file";
    return;
  }

  /* hz444_ambient */
  stopAmbientFile();

  const g = ensureAudioContext();
  if (!g) return;
  const { ctx, master } = g;

  if (activeOutput !== "hz444") {
    teardownHz444();
    startHz444(ctx, master);
  }

  applyMasterGain(ctx, master, s.volume01, s.duckForVoice);
  activeOutput = "hz444";

  if (s.timerPaused) {
    void ctx.suspend().catch(() => {});
  } else {
    void ctx.resume().catch(() => {
      /* autoplay / user gesture */
    });
  }
}

export function stopPrayerWheelBackgroundAudio(): void {
  stopAmbientFile();
  teardownHz444();
  activeOutput = "none";
  if (audioContext && masterGain) {
    try {
      applyMasterGain(audioContext, masterGain, 0, false);
    } catch {
      /* ignore */
    }
  }
  void audioContext?.suspend().catch(() => {});
}

export function resumePrayerWheelBackgroundAudioFromUserGesture(): void {
  if (typeof window === "undefined") return;
  if (activeOutput === "ambient_file" && ambientAudio) {
    void ambientAudio.play().catch(() => {});
  }
  if (activeOutput === "hz444" && audioContext) {
    void audioContext.resume().catch(() => {});
  }
}
