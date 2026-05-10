import type { User } from "@supabase/supabase-js";

const ENV_ENABLED = "GUIDED_JOURNEY_ENABLED";
const ENV_ADMIN_EMAILS = "GUIDED_JOURNEY_ADMIN_EMAILS";
const ENV_BYPASS_DELAY = "GUIDED_JOURNEY_BYPASS_DELAY";

/** Runtime env read — avoids Next compile-time replacement for custom keys. */
function envString(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined) return undefined;
  return String(v);
}

/** True for 1, true, yes (case-insensitive), after trim. */
export function isTruthyEnvString(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const t = raw.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}

/**
 * When true, Guided Journey is available to any signed-in user (subject to onboarding, etc.).
 * When false, only allowlisted admin emails may access journey routes and actions.
 */
export function isGuidedJourneyFeatureEnabled(): boolean {
  return isTruthyEnvString(envString(ENV_ENABLED));
}

/**
 * When true, SOAPS→lesson time gates are ignored (dev / admin testing).
 */
export function isGuidedJourneyDelayBypassed(): boolean {
  return isTruthyEnvString(envString(ENV_BYPASS_DELAY));
}

function parseAdminEmailSet(): Set<string> {
  const raw = envString(ENV_ADMIN_EMAILS)?.trim();
  if (!raw) return new Set();
  const set = new Set<string>();
  for (const part of raw.split(/[,;\s]+/)) {
    const e = part.trim().toLowerCase();
    if (e.length > 0) set.add(e);
  }
  return set;
}

/** Prefer JWT `email`; fall back to `user_metadata.email`. */
export function getEmailForGuidedJourneyAccess(user: User): string | null {
  if (user.email && typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email.trim();
  }
  const meta = user.user_metadata?.email;
  if (typeof meta === "string" && meta.trim().length > 0) {
    return meta.trim();
  }
  return null;
}

/**
 * Case-insensitive match against `GUIDED_JOURNEY_ADMIN_EMAILS` (comma/semicolon/whitespace separated).
 */
export function isGuidedJourneyAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return parseAdminEmailSet().has(normalized);
}

export function isGuidedJourneyAdminUser(user: User): boolean {
  return isGuidedJourneyAdminEmail(getEmailForGuidedJourneyAccess(user));
}

/**
 * Journey feature access: public rollout (`GUIDED_JOURNEY_ENABLED`) OR allowlisted admin.
 */
export function canAccessGuidedJourney(user: User): boolean {
  if (isGuidedJourneyAdminUser(user)) return true;
  return isGuidedJourneyFeatureEnabled();
}
