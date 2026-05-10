/**
 * Server-side checks for Guided Journey SOAPS steps.
 * Observation is stored as `journal_entries.user_reflection`.
 */

export type LatestSoapsFieldsRow = {
  scripture_text: string | null;
  user_reflection: string | null;
  application: string | null;
  prayer: string | null;
  soaps_share: string | null;
};

export function nonEmptyTrimmed(v: string | null | undefined): boolean {
  return (v?.trim().length ?? 0) > 0;
}

/** Scripture, observation, application, and prayer present (Share line not required). */
export function guidedSoapsReadyForShare(row: LatestSoapsFieldsRow | null | undefined): boolean {
  if (!row) return false;
  return (
    nonEmptyTrimmed(row.scripture_text) &&
    nonEmptyTrimmed(row.user_reflection) &&
    nonEmptyTrimmed(row.application) &&
    nonEmptyTrimmed(row.prayer)
  );
}

/** Full SOAPS entry on the latest row (including Share). */
export function guidedSoapsReadyForComplete(row: LatestSoapsFieldsRow | null | undefined): boolean {
  return guidedSoapsReadyForShare(row) && nonEmptyTrimmed(row?.soaps_share);
}

export const GUIDED_SOAPS_SHARE_GATE_MESSAGE =
  "Complete your SOAPS entry before sharing." as const;

export const GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE =
  "Finish all fields and share before continuing." as const;
