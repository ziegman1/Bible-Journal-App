/**
 * Prayer Wheel end-of-segment prompts: chime, voice (Web Speech API), or both.
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

/** Cancel any in-progress or queued speech (call before new segment or leaving the wheel). */
export function cancelPrayerWheelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

export type SpeakPrayerWheelSegmentPromptOptions = {
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Speak transition into the next segment. Phrase: "Now spend time in [title]" (title lowercased for natural TTS).
 */
export function speakPrayerWheelSegmentPrompt(
  nextSegmentTitle: string,
  options?: SpeakPrayerWheelSegmentPromptOptions
): void {
  if (!speechSynthesisSupported()) {
    options?.onEnd?.();
    return;
  }
  cancelPrayerWheelSpeech();
  const phrase = `Now spend time in ${nextSegmentTitle.trim().toLowerCase()}`;
  const u = new SpeechSynthesisUtterance(phrase);
  u.rate = 0.95;
  let finished = false;
  const finish = (which: "end" | "error") => {
    if (finished) return;
    finished = true;
    if (which === "end") options?.onEnd?.();
    else options?.onError?.();
  };
  u.onend = () => finish("end");
  u.onerror = () => finish("error");
  try {
    window.speechSynthesis.speak(u);
  } catch {
    finish("error");
  }
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
