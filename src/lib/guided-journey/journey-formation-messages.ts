/** Shown on /app/journey during SOAPS → lesson buffer (no countdown). */
export const GUIDED_SOAPS_REST_PANEL_LEAD =
  "You've completed this step." as const;

export const GUIDED_SOAPS_REST_PANEL_BODY =
  "Take time to live this out today. As you walk with God and practice what you've learned, your next step will open." as const;

export const GUIDED_SOAPS_REST_NEXT_SOON_LINE =
  "Next step available soon." as const;

/** Server: user tried to complete a lesson while the formation buffer is active. */
export const JOURNEY_LESSON_LOCKED_DURING_SOAPS_REST =
  "Your next lesson will open after you've had time to practice what God showed you. Keep walking with him today." as const;

/** Server: share intent during rest (step already complete). */
export const JOURNEY_SHARE_DURING_SOAPS_REST =
  "You've finished this SOAPS step. When your next lesson opens, you can continue from the journey home." as const;

/** Server: duplicate SOAPS completion. */
export const JOURNEY_SOAPS_STEP_ALREADY_COMPLETE =
  "You've already completed this SOAPS step." as const;

/** Server: Spiritual Breathing gated until first real invite handoff. */
export const JOURNEY_INVITE_GATHER_ONE_LEAD =
  "Open your journey invite page and send at least one text or email invite before continuing to the next lesson." as const;

/** Server: lesson complete blocked by invite count. */
export const JOURNEY_DUAL_LESSON_INVITES_REQUIRED =
  "Dual accountability means actually inviting people along—send at least three real text or email invites from your invite page before marking this lesson complete." as const;
