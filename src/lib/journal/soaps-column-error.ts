/** PostgREST error when `scripture_text` / `soaps_share` are missing from `journal_entries`. */
export function isMissingSoapsColumnsPostgrestError(
  message: string | undefined
): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("scripture_text") ||
    m.includes("soaps_share") ||
    (m.includes("column") &&
      (m.includes("does not exist") || m.includes("schema cache")))
  );
}
