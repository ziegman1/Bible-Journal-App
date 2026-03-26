/**
 * Canonical public origin for auth emails, invite links, and post-login redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in all deployed environments.
 * On Vercel, VERCEL_URL is always set — use it so confirmation links never fall back to localhost.
 */
export function getPublicSiteBaseUrl(): string {
  let raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    raw = raw.replace(/\/$/, "");
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    return raw;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

/** Hostname from NEXT_PUBLIC_SITE_URL (for invite “wrong domain” hints). */
export function getCanonicalSiteHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).host.toLowerCase();
  } catch {
    return null;
  }
}
