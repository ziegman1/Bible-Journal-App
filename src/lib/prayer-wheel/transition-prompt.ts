/**
 * Prayer Wheel end-of-segment prompts: chime, voice (Web Speech API), or both.
 *
 * Chrome quirk: calling speak() in the same synchronous turn as cancel() often drops the utterance.
 * We defer speak to a microtask and call speechSynthesis.resume() before speak.
 */

export type PrayerWheelTransitionMode =
  | "chime_only"
  | "voice_only"
  | "chime_and_voice";

const STORAGE_KEY = "badwr.prayerWheel.transitionMode";

export const PRAYER_WHEEL_TRANSITION_MODES: readonly {
  value: PrayerWheelTransitionMode;
  label: string;
}[] = [
  { value: "chime_only", label: "Chime only" },
  { value: "voice_only", label: "Voice only" },
  { value: "chime_and_voice", label: "Chime + voice" },
];

export const DEFAULT_PRAYER_WHEEL_TRANSITION_MODE: PrayerWheelTransitionMode =
  "chime_only";

const VOICE_DEBUG =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

function voiceLog(...args: unknown[]): void {
  if (VOICE_DEBUG) {
    console.info("[PrayerWheel voice]", ...args);
  }
}

export function readPrayerWheelTransitionMode(): PrayerWheelTransitionMode {
  if (typeof window === "undefined") return DEFAULT_PRAYER_WHEEL_TRANSITION_MODE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (
      raw === "chime_only" ||
      raw === "voice_only" ||
      raw === "chime_and_voice"
    ) {
      return raw;
    }
  } catch {
    /* private mode */
  }
  return DEFAULT_PRAYER_WHEEL_TRANSITION_MODE;
}

export function writePrayerWheelTransitionMode(
  mode: PrayerWheelTransitionMode
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* quota / private mode */
  }
}

export function speechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

/**
 * Call from a user gesture (e.g. Start prayer wheel) so engines that tie TTS to activation
 * have a better chance to speak later at segment boundaries.
 */
export function primePrayerWheelSpeechSynthesis(): void {
  if (!speechSynthesisSupported()) return;
  try {
    window.speechSynthesis.resume();
    void window.speechSynthesis.getVoices();
    requestAnimationFrame(() => {
      try {
        window.speechSynthesis?.resume();
        void window.speechSynthesis?.getVoices();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

/** Cancel any in-progress or queued speech (call before new segment or leaving the wheel). */
export function cancelPrayerWheelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

function applyPreferredVoice(u: SpeechSynthesisUtterance): void {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;
  const enDefault = voices.find(
    (v) => v.lang.toLowerCase().startsWith("en") && v.default
  );
  const en =
    enDefault ?? voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  const picked = en ?? voices[0];
  if (picked) {
    u.voice = picked;
    voiceLog("voice picked", picked.name, picked.lang);
  }
}

/**
 * Many browsers populate getVoices() asynchronously (voiceschanged).
 */
function whenVoicesReady(synth: SpeechSynthesis, then: () => void): void {
  if (synth.getVoices().length > 0) {
    queueMicrotask(then);
    return;
  }
  let ran = false;
  const runOnce = () => {
    if (ran) return;
    ran = true;
    synth.removeEventListener("voiceschanged", onVc);
    then();
  };
  const onVc = () => runOnce();
  synth.addEventListener("voiceschanged", onVc);
  window.setTimeout(runOnce, 600);
}

export type SpeakPrayerWheelSegmentPromptOptions = {
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Speak: "Now spend time in [segment title]" (title trimmed; casing as provided).
 */
export function speakPrayerWheelSegmentPrompt(
  nextSegmentTitle: string,
  options?: SpeakPrayerWheelSegmentPromptOptions
): void {
  if (!speechSynthesisSupported()) {
    voiceLog("speak skipped: not supported");
    options?.onEnd?.();
    return;
  }

  const phrase = `Now spend time in ${nextSegmentTitle.trim()}`;
  voiceLog("speak queued", { phrase });

  cancelPrayerWheelSpeech();

  const synth = window.speechSynthesis;

  const speakNow = () => {
    try {
      synth.resume();
    } catch {
      /* ignore */
    }

    const u = new SpeechSynthesisUtterance(phrase);
    u.rate = 0.95;
    applyPreferredVoice(u);

    let finished = false;
    const finish = (which: "end" | "error") => {
      if (finished) return;
      finished = true;
      voiceLog(`utterance ${which}`);
      if (which === "end") options?.onEnd?.();
      else options?.onError?.();
    };

    u.onstart = () => voiceLog("utterance onstart");
    u.onend = () => finish("end");
    u.onerror = (ev) => {
      voiceLog("utterance onerror", ev.error, ev);
      finish("error");
    };

    window.setTimeout(() => {
      try {
        synth.resume();
        synth.speak(u);
        voiceLog("speechSynthesis.speak called");
      } catch (e) {
        voiceLog("speechSynthesis.speak threw", e);
        finish("error");
      }
    }, 0);
  };

  queueMicrotask(() => {
    whenVoicesReady(synth, speakNow);
  });
}

export function resolveEffectiveTransitionMode(
  mode: PrayerWheelTransitionMode
): PrayerWheelTransitionMode {
  if (!speechSynthesisSupported()) {
    if (mode === "voice_only" || mode === "chime_and_voice") {
      return "chime_only";
    }
  }
  return mode;
}
