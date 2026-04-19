/**
 * Branding, metadata, public URLs, and support-contact helpers.
 * **Store / TestFlight / Play checklist:** `FINAL_SUBMISSION_CHECKLIST.md` (repository root).
 */
import type { Metadata } from "next";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";

/**
 * Square logo — light background (day / default). Used by favicon script and `BadwrLogo` in light theme.
 * File: `public/badwr-logo-square.png`.
 */
export const APP_LOGO_PATH_LIGHT = "/badwr-logo-square.png";

/**
 * Square logo — dark background (night). JPEG 1024×1024; `BadwrLogo` switches via `next-themes`.
 * File: `public/badwr-logo-square-dark.jpg`.
 */
export const APP_LOGO_PATH_DARK = "/badwr-logo-square-dark.jpg";

/** @deprecated Prefer {@link APP_LOGO_PATH_LIGHT} — alias kept for scripts expecting `APP_LOGO_PATH`. */
export const APP_LOGO_PATH = APP_LOGO_PATH_LIGHT;

/**
 * Wide share / marketing art for link previews (light). Crawlers ignore dark mode; keep one canonical OG asset.
 * File: `public/badwr-logo-og.png`.
 */
export const APP_SHARE_IMAGE_PATH = "/badwr-logo-og.png";

/** Wide logo on dark background — optional (e.g. in-app or future themed previews). `public/badwr-logo-og-dark.png`. */
export const APP_SHARE_IMAGE_PATH_DARK = "/badwr-logo-og-dark.png";

/** Alt text for logo images (descriptive for screen readers). */
export const APP_LOGO_ALT =
  "BADWR shield logo — Be a Disciple Worth Reproducing";

/** Primary product name (UI, metadata default title, auth headings). */
export const APP_NAME = "BADWR";

/** Same as {@link APP_NAME} — used where a “short name” field is expected (icons, template suffix). */
export const APP_SHORT_NAME = APP_NAME;

/** Same as {@link APP_NAME} — marketing/legal references to the product. */
export const APP_MARKETING_NAME = APP_NAME;

/** Subtitle under the main BADWR title (landing, footer, legal chrome). */
export const APP_TAGLINE = "Be a Disciple Worth Reproducing";

/** Landing hero body line (public home only). */
export const APP_LANDING_HERO_BLURB =
  "Become a disciple that the Lord would delight in reproducing.";

/** Meta / OG / manifest description (concise). */
export const APP_DESCRIPTION = `${APP_TAGLINE} ${APP_LANDING_HERO_BLURB}`;

/** Shown in footer and mailto when `NEXT_PUBLIC_SUPPORT_EMAIL` is unset. */
export const DEFAULT_PUBLIC_SUPPORT_EMAIL = "support@badwr.app";

/** Canonical marketing URL (display and external links). */
export const PUBLIC_APP_WEBSITE = "https://www.badwr.app";

/**
 * Update when you publish material changes to `/privacy`, `/terms`, or `/support`.
 * Single source for “Last updated” on those pages.
 */
export const LEGAL_DOCUMENTS_LAST_UPDATED = "March 31, 2026";

/** Valid public email shape — used to avoid broken `mailto:` until `NEXT_PUBLIC_SUPPORT_EMAIL` is set. */
export function isSupportEmailConfigured(): boolean {
  const e =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim().replace(/^mailto:/i, "") ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Support address for display (footer, etc.). Empty until `NEXT_PUBLIC_SUPPORT_EMAIL` is a valid email.
 */
export function getSupportEmail(): string {
  const e =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim().replace(/^mailto:/i, "") ?? "";
  return isSupportEmailConfigured() ? e : "";
}

/** Public support address for display and mailto (env override, else default inbox). */
export function getPublicSupportEmail(): string {
  return getSupportEmail() || DEFAULT_PUBLIC_SUPPORT_EMAIL;
}

export function getPublicSupportMailtoHref(): string {
  return `mailto:${getPublicSupportEmail()}`;
}

/**
 * Hostname or short name for “Sent from …” in shared text and email footers (no invented domain).
 */
export function getSharePromoAttributionLabel(): string {
  const origin = getPublicSiteBaseUrl();
  try {
    const host = new URL(origin).host;
    if (
      host &&
      host !== "localhost" &&
      !host.startsWith("127.0.0.1") &&
      host !== "[::1]"
    ) {
      return host;
    }
  } catch {
    /* ignore */
  }
  return APP_SHORT_NAME;
}

/** Canonical origin for metadataBase, Open Graph URLs, and absolute links in emails. */
export function getSiteOriginForMetadata(): string {
  return getPublicSiteBaseUrl();
}

export function getPrivacyPolicyUrl(): string {
  const base = getPublicSiteBaseUrl().replace(/\/$/, "");
  return `${base}/privacy`;
}

export function getTermsOfServiceUrl(): string {
  const base = getPublicSiteBaseUrl().replace(/\/$/, "");
  return `${base}/terms`;
}

export function getSupportPageUrl(): string {
  const base = getPublicSiteBaseUrl().replace(/\/$/, "");
  return `${base}/support`;
}

const DEFAULT_OG_THEME_BG = "#1c1917";
const DEFAULT_OG_THEME_FG = "#fafaf9";

export const BRAND_OG = {
  background: DEFAULT_OG_THEME_BG,
  foreground: DEFAULT_OG_THEME_FG,
} as const;

/** Browser UI tint (tab bar / PWA). Aligns with stone-900 light / stone-950 dark feel. */
export const THEME_COLOR_LIGHT = "#1c1917";
export const THEME_COLOR_DARK = "#0c0a09";

/** Allowlisted post–auth redirect targets from `/auth/callback` query params. */
export function isAllowedPostAuthPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.startsWith("/app")) return true;
  if (path === "/onboarding") return true;
  if (path.startsWith("/scripture")) return true;
  return false;
}

export function resolvePostAuthDestination(
  redirectTo: string | null,
  next: string | null
): string {
  if (redirectTo && isAllowedPostAuthPath(redirectTo)) return redirectTo;
  if (next && isAllowedPostAuthPath(next)) return next;
  return "/app";
}

export function buildRootMetadata(): Metadata {
  const origin = getSiteOriginForMetadata();
  let metadataBase: URL;
  try {
    metadataBase = new URL(origin);
  } catch {
    metadataBase = new URL("https://localhost");
  }

  const title = {
    default: APP_NAME,
    template: `%s · ${APP_SHORT_NAME}`,
  };

  return {
    metadataBase,
    applicationName: APP_SHORT_NAME,
    title,
    description: APP_DESCRIPTION,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    openGraph: {
      title: `${APP_SHORT_NAME} · ${APP_TAGLINE}`,
      description: APP_DESCRIPTION,
      url: origin,
      siteName: APP_SHORT_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${APP_SHORT_NAME} · ${APP_TAGLINE}`,
      description: APP_DESCRIPTION,
    },
  };
}
