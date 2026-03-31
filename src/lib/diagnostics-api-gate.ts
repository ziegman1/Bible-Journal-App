/**
 * Blocks public diagnostic HTTP routes in production so config/mail checks are not exposed.
 *
 * - Vercel Production: always blocked
 * - `next start` locally (NODE_ENV=production, no Vercel): blocked
 * - `next dev` and Vercel Preview: allowed
 */
export function isPublicDiagnosticsBlocked(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") {
    return true;
  }
  return false;
}
