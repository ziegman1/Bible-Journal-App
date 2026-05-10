/**
 * Guided Journey: SOAPS step completion policy
 *
 * Completion requires the **latest** `journal_entries` row (by `updated_at`) to have non-empty:
 * - `scripture_text`, `user_reflection` (observation), `application`, `prayer`, and `soaps_share`.
 *
 * Share via Text/Email on the journey page does **not** unlock progression. It may still call
 * {@link import("@/app/actions/linear-journey").recordLinearSoapsShareIntent} to record that the user
 * opened a channel (after Scripture–prayer are present on that latest row), for optional UX feedback only.
 *
 * UI gating and server validation both use {@link import("@/lib/guided-journey/latest-soaps-readiness")}.
 */

export type SoapsJourneyStepKey = "soaps_1" | "soaps_2" | "soaps_3";
