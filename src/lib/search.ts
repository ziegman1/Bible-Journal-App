/**
 * Sanitizes user search input for use in Supabase ilike filters.
 * Prevents overly broad matches, limits length, and escapes special chars.
 */
const MAX_SEARCH_LENGTH = 200;

export function sanitizeSearchQuery(input: string | undefined | null): string | null {
  if (input == null || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_SEARCH_LENGTH) return trimmed.slice(0, MAX_SEARCH_LENGTH);
  // Escape % \ and ' for ilike (PostgreSQL wildcards and string delimiter)
  return trimmed.replace(/[%\\']/g, "\\$&");
}
