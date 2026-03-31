/**
 * Values consumed by `capacitor.config.ts` only (Node / Capacitor CLI).
 * Do not import this from Next.js app code.
 *
 * Native `appId` must stay in sync with:
 * - `android/app/build.gradle` → `applicationId`
 * - `ios/.../project.pbxproj` → `PRODUCT_BUNDLE_IDENTIFIER`
 * Keep in sync with synced `capacitor.config.json` under ios/android (or set `CAPACITOR_APP_ID`).
 */
export const DEFAULT_CAPACITOR_APP_ID = "app.badwr.beadiscipleworthreproducing";

export const DEFAULT_CAPACITOR_APP_NAME = "BADWR";

function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function withCacheBust(url: string): string {
  // Keep base origin/path; add a stable cache-busting query param for native shells.
  // If a query already exists, append with '&'. Avoid duplicating if already present.
  const value = process.env.CAPACITOR_CACHE_BUST?.trim() || "20260331";
  if (!value) return url;
  if (url.includes("native_build=") || url.includes("v=")) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}v=${encodeURIComponent(value)}`;
}

/**
 * URL the WebView loads (your deployed Next.js site). This project does **not** use a static
 * `next export` output; Capacitor must load the live SSR app over HTTPS.
 *
 * Resolution order:
 * 1. CAPACITOR_SERVER_URL — explicit (e.g. staging preview)
 * 2. NEXT_PUBLIC_SITE_URL — same canonical origin as auth/callback and invite links
 * 3. VERCEL_URL — Vercel CI / CLI (https://…)
 * 4. Production default so `cap sync` never omits `server.url` (avoids www-only fallback in the shell)
 */
export function resolveCapacitorServerUrl(): string {
  const explicit = process.env.CAPACITOR_SERVER_URL?.trim();
  if (explicit) return withCacheBust(normalizeHttpUrl(explicit));

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return withCacheBust(normalizeHttpUrl(site));

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return withCacheBust(`https://${host}`);
  }

  return withCacheBust("https://www.badwr.app");
}
