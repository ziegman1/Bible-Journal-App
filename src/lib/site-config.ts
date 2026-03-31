/**
 * Branding, legal templates, metadata, and support-contact helpers.
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

/**
 * Update when you publish material changes to `/privacy` or `/terms`.
 * Single source for “Last updated” on legal pages.
 */
export const LEGAL_DOCUMENTS_LAST_UPDATED = "March 29, 2026";

/*
 * === PRE-SUBMISSION LEGAL (App Store / counsel) ===
 * Before public distribution: replace PLACEHOLDER_LEGAL_ENTITY and every TODO in LEGAL_DOC_PLACEHOLDERS
 * below with counsel-reviewed copy. Do not ship with placeholders if policies are presented as final.
 */

/**
 * Operator identity for Privacy/Terms — not a claim of incorporation until counsel replaces this.
 */
export const PLACEHOLDER_LEGAL_ENTITY =
  "[Operator legal name, entity type, and principal jurisdiction to be added before public App Store distribution.]";

/**
 * Template fragments for Privacy and Terms. Edit here only — pages import these keys.
 * Each value is intentionally a checklist-style TODO; do not treat as factual until replaced.
 */
export const LEGAL_DOC_PLACEHOLDERS = {
  privacy: {
    authProviderDetail:
      "TODO — Legal: Name your account authentication provider and link its privacy notice or DPA (if applicable).",
    technicalInfrastructure:
      "TODO — Legal: List what your hosting, analytics, and logging stack actually collects (verify with vendors).",
    additionalPurposes:
      "TODO — Legal: List any further processing purposes (e.g. analytics, marketing) and lawful basis — omit if not applicable.",
    cookieDetails:
      "TODO — Legal: Provide a cookie/local storage table or link to detail (names, duration, purpose).",
    hostingVendor:
      "TODO — Legal: Name your application host (and region if you disclose it).",
    databaseAuthVendor:
      "TODO — Legal: Name your database and authentication vendor (and region/DPA links if required).",
    emailVendor: "TODO — Legal: Name your transactional email vendor.",
    aiAndScriptureVendors:
      "TODO — Legal: List AI or scripture API vendors and what personal data is sent, if any.",
    vendorPrivacyLinks:
      "TODO — Legal: Subprocessor list or links to vendor privacy policies.",
    retentionSchedule:
      "TODO — Legal: Retention periods for backups, logs, and deleted accounts.",
    securitySummary: "TODO — Legal: High-level description of security measures.",
    regionalPrivacyRights:
      "TODO — Legal: If EU/UK/EEA or similar laws apply, state lawful bases, rights, and any representative or supervisory authority details as required.",
    childAgeThreshold:
      "TODO — Legal: State the minimum age for using the Service (e.g. 13 or 16) consistent with your jurisdiction and policy.",
    childrensPrivacyRules:
      "TODO — Legal: Applicable children's privacy rules and your response process.",
    internationalTransfers:
      "TODO — Legal: Cross-border transfers and safeguards (e.g. Standard Contractual Clauses), if applicable.",
    materialChangeNotice:
      "TODO — Legal: How you notify users of material Privacy Policy changes.",
  },
  terms: {
    eligibilityJurisdiction:
      "TODO — Legal: Minimum age and legal capacity rules for your jurisdiction.",
    extraAcceptableUse:
      "TODO — Legal: Any extra acceptable-use rules specific to your product or sector.",
    scriptureLicensing:
      "TODO — Legal: How scripture text is made available (licensed API, public domain, etc.).",
    aiTraining:
      "TODO — Legal: Whether user content is used to train models; if not, state that explicitly.",
    thirdPartyList:
      "TODO — Legal: Key third-party integrations; their terms/policies apply to their processing.",
    disclaimerJurisdiction:
      "TODO — Legal: Mandatory disclaimers and consumer protections for your jurisdiction.",
    liabilityCapFees:
      "TODO — Legal: Liability cap tied to fees paid in a defined period (counsel to set).",
    liabilityMinimumSafeHarbor:
      "TODO — Legal: Alternative minimum cap where law permits (counsel to set).",
    governingLawRegion:
      "TODO — Legal: State or country whose laws govern these Terms.",
    disputeResolution: "TODO — Legal: Courts or arbitration and venue rules.",
    euConsumerDisputes:
      "TODO — Legal: EU/UK/EEA or other consumer dispute channels — or state not applicable.",
    indemnityJurisdiction:
      "TODO — Legal: Qualifier for indemnity enforceability in your jurisdiction.",
    dataExportOnTermination:
      "TODO — Legal: Data export, download, and deletion when accounts end.",
    materialTermsChangeNotice:
      "TODO — Legal: Notice or consent for material Terms changes where required.",
  },
} as const;

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
