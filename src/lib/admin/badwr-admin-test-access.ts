import type { User } from "@supabase/supabase-js";
import { getEmailForGuidedJourneyAccess, isGuidedJourneyAdminEmail } from "@/lib/guided-journey/guided-journey-access";
import { isScriptureModuleOperatorEmail } from "@/lib/scripture-module/access-eval";

const ENV_BADWR_ADMIN_EMAILS = "BADWR_ADMIN_EMAILS";

function envString(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined) return undefined;
  return String(v);
}

function parseEmailSet(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  const set = new Set<string>();
  for (const part of raw.split(/[,;\s]+/)) {
    const e = part.trim().toLowerCase();
    if (e.length > 0) set.add(e);
  }
  return set;
}

function badwrAdminEmailAllowlist(): Set<string> {
  return parseEmailSet(envString(ENV_BADWR_ADMIN_EMAILS)?.trim());
}

/**
 * Email allowlisted for BADWR app-level QA / admin test surfaces (`BADWR_ADMIN_EMAILS`),
 * or already authorized as Guided Journey admin or Scripture module operator.
 *
 * Fail closed: unknown users are never admins.
 */
export function isBadwrAdminTestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const email = getEmailForGuidedJourneyAccess(user);
  if (!email) return false;
  const n = email.trim().toLowerCase();
  if (!n) return false;
  if (badwrAdminEmailAllowlist().has(n)) return true;
  if (isGuidedJourneyAdminEmail(email)) return true;
  if (isScriptureModuleOperatorEmail(email)) return true;
  return false;
}

export function getEmailForBadwrAdminTestAccess(user: User | null | undefined): string | null {
  if (!user) return null;
  return getEmailForGuidedJourneyAccess(user);
}
