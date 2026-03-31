/** Persisted on `profiles.growth_mode`. */
export type GrowthMode = "guided" | "intentional" | "focused";

/** Drives copy and optional softening (not all surfaces use every flag). */
export type GrowthCopyTone = "invitational" | "balanced" | "accountability";

/** Derived flags for gating UI without scattering mode checks. */
export type GrowthModePresentation = {
  mode: GrowthMode;
  showStreakStats: boolean;
  showBadwrReproductionCard: boolean;
  showPracticePaceMeters: boolean;
  showWeeklyRhythmGoalsInSettings: boolean;
  softenPerformanceCopy: boolean;
  copyTone: GrowthCopyTone;
};
