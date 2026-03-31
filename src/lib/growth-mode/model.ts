import type { GrowthCopyTone, GrowthMode, GrowthModePresentation } from "@/lib/growth-mode/types";

export const GROWTH_MODES: readonly GrowthMode[] = ["guided", "intentional", "focused"] as const;

export const GROWTH_MODE_LABEL: Record<GrowthMode, string> = {
  guided: "Guided Growth",
  intentional: "Intentional Growth",
  focused: "Focused Growth",
};

/** Short settings / onboarding descriptions */
export const GROWTH_MODE_DESCRIPTION: Record<GrowthMode, string> = {
  guided:
    "Focus on the practices and tools without visible pressure from goals and performance tracking.",
  intentional:
    "A balanced experience with light accountability and gentle progress visibility.",
  focused:
    "The full BADWR experience with goals, streaks, pace, and accountability tools visible.",
};

export function normalizeGrowthMode(raw: unknown): GrowthMode {
  if (raw === "guided" || raw === "intentional" || raw === "focused") return raw;
  return "focused";
}

export function isGuidedGrowth(mode: GrowthMode): boolean {
  return mode === "guided";
}

export function isIntentionalGrowth(mode: GrowthMode): boolean {
  return mode === "intentional";
}

export function isFocusedGrowth(mode: GrowthMode): boolean {
  return mode === "focused";
}

export function shouldShowStreaks(p: GrowthModePresentation): boolean {
  return p.showStreakStats;
}

export function shouldShowGoals(p: GrowthModePresentation): boolean {
  return p.showWeeklyRhythmGoalsInSettings;
}

export function shouldShowAdvancedMetrics(p: GrowthModePresentation): boolean {
  return p.showBadwrReproductionCard;
}

export function shouldUseGentleLanguage(p: GrowthModePresentation): boolean {
  return p.copyTone !== "accountability";
}

/** For `<GrowthModeGate minMode="intentional">`: guided=0, intentional=1, focused=2 */
export function growthModeRank(mode: GrowthMode): number {
  if (mode === "guided") return 0;
  if (mode === "intentional") return 1;
  return 2;
}

export function modeMeetsMinimum(current: GrowthMode, minMode: GrowthMode): boolean {
  return growthModeRank(current) >= growthModeRank(minMode);
}

export function getGrowthModePresentation(mode: GrowthMode): GrowthModePresentation {
  if (mode === "guided") {
    return {
      mode,
      showStreakStats: false,
      showBadwrReproductionCard: false,
      showPracticePaceMeters: false,
      showWeeklyRhythmGoalsInSettings: false,
      softenPerformanceCopy: true,
      copyTone: "invitational",
    };
  }
  if (mode === "intentional") {
    return {
      mode,
      showStreakStats: true,
      showBadwrReproductionCard: true,
      showPracticePaceMeters: true,
      showWeeklyRhythmGoalsInSettings: true,
      softenPerformanceCopy: true,
      copyTone: "balanced",
    };
  }
  return {
    mode,
    showStreakStats: true,
    showBadwrReproductionCard: true,
    showPracticePaceMeters: true,
    showWeeklyRhythmGoalsInSettings: true,
    softenPerformanceCopy: false,
    copyTone: "accountability",
  };
}

export function copyToneForMode(mode: GrowthMode): GrowthCopyTone {
  return getGrowthModePresentation(mode).copyTone;
}
