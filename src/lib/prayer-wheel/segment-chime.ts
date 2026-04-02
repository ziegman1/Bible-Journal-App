/**
 * Soft meditation-style bell for Prayer Wheel segment transitions.
 * Prefers short HTML5 &lt;audio&gt; clips (same autoplay path as ambient music); falls back to Web Audio.
 * Call {@link primePrayerWheelChimeAudio} from a user gesture (e.g. Start) so the Web Audio fallback
 * can run later when the segment ends without a fresh gesture.
 */

const CHIME_HTML_SRCS = ["/audio/prayer-bell.mp3", "/sounds/bell.mp3"] as const;
const FILE_CUTOFF_MS = 4000;
const FILE_VOLUME = 0.22;

const ATTACK_S = 0.17;
const DECAY_S = 3.25;
const SYNTH_PEAK = 0.2;

const SYNTH_PARTIALS: readonly { hz: number; weight: number }[] = [
  { hz: 185, weight: 1 },
  { hz: 277, weight: 0.42 },
  { hz: 350, weight: 0.14 },
];

let synthCtx: AudioContext | null = null;
type SynthActive = {
  oscillators: OscillatorNode[];
  master: GainNode;
};
let synthActive: SynthActive | null = null;
let synthCleanupTimer: number | null = null;

/** Currently playing one-shot HTML chime (if any). */
let activeHtmlChime: HTMLAudioElement | null = null;
let htmlStopTimer: number | null = null;

/** Bumped on stop so in-flight async chime attempts do not start after cancel. */
let chimeGeneration = 0;

function clearHtmlStopTimer(): void {
  if (htmlStopTimer != null) {
    window.clearTimeout(htmlStopTimer);
    htmlStopTimer = null;
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

/**
 * Resume (or create) the Web Audio context used for the synthetic bell.
 * Invoke from Start / Resume / etc. so segment-end playback is not stuck in "suspended".
 */
export function primePrayerWheelChimeAudio(): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    if (!synthCtx) synthCtx = new Ctx();
    void synthCtx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
}

function playSyntheticBell(token?: number): void {
  if (token != null && token !== chimeGeneration) return;
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

async function tryPlayHtmlChimeChain(token: number): Promise<boolean> {
  for (const src of CHIME_HTML_SRCS) {
    if (token !== chimeGeneration) return true;
    const el = new Audio(src);
    el.preload = "auto";
    el.volume = FILE_VOLUME;
    try {
      await el.play();
      if (token !== chimeGeneration) {
        el.pause();
        el.currentTime = 0;
        return true;
      }
      activeHtmlChime = el;
      clearHtmlStopTimer();
      htmlStopTimer = window.setTimeout(() => {
        htmlStopTimer = null;
        el.pause();
        el.currentTime = 0;
        if (activeHtmlChime === el) activeHtmlChime = null;
      }, FILE_CUTOFF_MS);
      return true;
    } catch {
      /* try next src */
    }
  }
  return false;
}

/**
 * Stops any in-progress segment chime (HTML or synthesized).
 */
export function stopPrayerWheelSegmentChime(): void {
  chimeGeneration++;
  clearHtmlStopTimer();
  if (activeHtmlChime) {
    activeHtmlChime.pause();
    activeHtmlChime.currentTime = 0;
    activeHtmlChime = null;
  }
  teardownSynth();
}

/**
 * One gentle bell strike: no loop. Restarts cleanly if called again while a chime is playing.
 */
export function playPrayerWheelSegmentChime(): void {
  if (typeof window === "undefined") return;
  stopPrayerWheelSegmentChime();
  const token = chimeGeneration;

  void (async () => {
    const ok = await tryPlayHtmlChimeChain(token);
    if (!ok) {
      playSyntheticBell(token);
    }
  })();
}
