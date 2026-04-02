/**
 * Single source of truth for “must show /onboarding before 3/3rds meetings”.
 *
 * - Uses only `groups` columns + member count (no profiles or user history).
 * - CHAT workspaces (`group_kind === 'chat'`) never need this prompt.
 * - With &lt;2 members, the prompt is deferred (invite flow).
 * - If `starter_track_prompt_answered` is missing on the row, falls back to
 *   `onboarding_pending` so pre-column deploys still gate correctly.
 *
 * Keep in sync: `getStarterTrackPromptGateForGroup`, `createGroupMeeting` guard,
 * and DB trigger `assert_starter_track_prompt_before_group_meeting` (migration 051).
 */
export function groupNeedsStarterTrackPrompt(args: {
  groupKind?: string | null;
  starterTrackPromptAnswered?: boolean | null;
  onboardingPending?: boolean | null;
  memberCount: number;
}): boolean {
  if ((args.groupKind ?? "thirds") !== "thirds") return false;
  if (args.memberCount < 2) return false;
  if (args.starterTrackPromptAnswered === false) return true;
  if (
    args.starterTrackPromptAnswered == null &&
    args.onboardingPending === true
  ) {
    return true;
  }
  return false;
}
