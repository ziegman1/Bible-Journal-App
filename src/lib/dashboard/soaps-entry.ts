/** Row shape from a minimal journal select used to count SOAPS completions. */
export type SoapsJournalRow = {
  scripture_text: string | null;
  soaps_share: string | null;
  user_reflection: string | null;
  prayer: string | null;
  application: string | null;
};

export function isQualifyingSoapsEntry(row: SoapsJournalRow): boolean {
  if ((row.scripture_text ?? "").trim().length > 0) return true;
  if ((row.soaps_share ?? "").trim().length > 0) return true;
  const o = (row.user_reflection ?? "").trim();
  const p = (row.prayer ?? "").trim();
  const a = (row.application ?? "").trim();
  return o.length > 0 && p.length > 0 && a.length > 0;
}
