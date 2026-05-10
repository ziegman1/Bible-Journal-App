/**
 * Shared copy for solo Look Up — Devotional and DBS modes use the same four discovery questions.
 * (Group Look Up uses richer multi-line prompts in look-up-section.tsx; not refactored here per product scope.)
 */
export const SOLO_DISCOVERY_QUESTIONS = {
  like: "What do you like about this passage?",
  difficult: "What seems difficult or challenging?",
  people: "What does this teach us about people?",
  god: "What does this teach us about God?",
} as const;

export type SoloDiscoveryQuestionKey = keyof typeof SOLO_DISCOVERY_QUESTIONS;
