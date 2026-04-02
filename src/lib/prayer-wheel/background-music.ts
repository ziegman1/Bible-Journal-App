/**
 * Optional Prayer Wheel background audio: soft ambient pad or a 444 Hz–labeled sine tone.
 * No claims about frequency—UI presents it only as an optional ambient choice.
 */

export type PrayerWheelBgMusicMode = "off" | "ambient" | "hz444_ambient";

const MODE_KEY = "badwr.prayerWheel.bgMusicMode";
const VOLUME_KEY = "badwr.prayerWheel.bgMusicVolume";

export const PRAYER_WHEEL_BG_MUSIC_OPTIONS: readonly {
  value: PrayerWheelBgMusicMode;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "ambient", label: "Ambient music" },
  {
    value: "hz444_ambient",
    label: "444 Hz ambient (optional tone)",
  },
];

export const DEFAULT_PRAYER_WHEEL_BG_MUSIC_MODE: PrayerWheelBgMusicMode = "off";
export const DEFAULT_PRAYER_WHEEL_BG_MUSIC_VOLUME = 0.35;

const DUCK_MULT = 0.22;
const GAIN_RAMP_S = 0.04;

/** Hz for the labeled ambient option only (not marketed as therapeutic). */
const LABELED_TONE_HZ = 444;

/** Low, soft partials for synthetic ambient pad (loops via continuous oscillators). */
const AMBIENT_PAD_FREQS_HZ = [65.41, 98.0, 146.83, 196.0] as const;
const AMBIENT_PER_OSC_GAIN = 0.012;
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

type ActiveGraph = "none" | "ambient" | "hz444";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeGraph: ActiveGraph = "none";
let oscillators: OscillatorNode[] = [];
let stemGains: GainNode[] = [];

function teardownGraph(): void {
  for (const o of oscillators) {
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
  oscillators = [];
  for (const g of stemGains) {
    try {
      g.disconnect();
    } catch {
      /* ignore */
    }
  }
  stemGains = [];
  activeGraph = "none";
}

function ensureGraph(): { ctx: AudioContext; master: GainNode } | null {
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

function startAmbientPad(ctx: AudioContext, master: GainNode): void {
  for (const hz of AMBIENT_PAD_FREQS_HZ) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.value = AMBIENT_PER_OSC_GAIN;
    osc.connect(g);
    g.connect(master);
    osc.start();
    oscillators.push(osc);
    stemGains.push(g);
  }
  activeGraph = "ambient";
}

function startHz444(ctx: AudioContext, master: GainNode): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = LABELED_TONE_HZ;
  const g = ctx.createGain();
  g.gain.value = HZ444_PER_OSC_GAIN;
  osc.connect(g);
  g.connect(master);
  osc.start();
  oscillators.push(osc);
  stemGains.push(g);
  activeGraph = "hz444";
}

function applyOutputGain(
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

export type PrayerWheelBackgroundAudioSync = {
  /** Only while phase is `"running"` (not save_error / complete / setup). */
  sessionActive: boolean;
  timerPaused: boolean;
  mode: PrayerWheelBgMusicMode;
  /** User music volume 0–1. */
  volume01: number;
  duckForVoice: boolean;
};

/**
 * Single owner for Prayer Wheel background audio: one graph at a time, no stacking.
 * Call from React effects and once synchronously after "Start prayer wheel" (user gesture) to improve autoplay success.
 */
export function syncPrayerWheelBackgroundAudio(s: PrayerWheelBackgroundAudioSync): void {
  const g = ensureGraph();
  if (!g) return;
  const { ctx, master } = g;

  if (!s.sessionActive || s.mode === "off") {
    teardownGraph();
    applyOutputGain(ctx, master, 0, false);
    void ctx.suspend().catch(() => {});
    return;
  }

  const wantGraph: ActiveGraph = s.mode === "ambient" ? "ambient" : "hz444";

  if (activeGraph !== wantGraph) {
    teardownGraph();
    if (s.mode === "ambient") startAmbientPad(ctx, master);
    else startHz444(ctx, master);
  }

  applyOutputGain(ctx, master, s.volume01, s.duckForVoice);

  if (s.timerPaused) {
    void ctx.suspend().catch(() => {});
  } else {
    void ctx.resume().catch(() => {
      /* autoplay / user gesture — next sync or start click may recover */
    });
  }
}

/** Stop all background audio (unmount, session end, track off). */
export function stopPrayerWheelBackgroundAudio(): void {
  teardownGraph();
  if (audioContext && masterGain) {
    try {
      applyOutputGain(audioContext, masterGain, 0, false);
    } catch {
      /* ignore */
    }
  }
  void audioContext?.suspend().catch(() => {});
}

/**
 * Resume AudioContext after a user gesture if session should be audible.
 * Safe no-op if nothing to resume.
 */
export function resumePrayerWheelBackgroundAudioFromUserGesture(): void {
  const g = ensureGraph();
  if (!g) return;
  void g.ctx.resume().catch(() => {});
}
