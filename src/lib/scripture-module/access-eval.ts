import type { User } from "@supabase/supabase-js";

/**
 * Edge-safe scripture module allowlist evaluation (no `process.cwd()` or Node-only APIs).
 * Used by middleware via {@link isBadwrAdminTestUser}. Full module re-exports from `access.ts`.
 */

export function getEmailForScriptureAccess(user: User): string | null {
  if (user.email && typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email.trim();
  }
  const meta = user.user_metadata?.email;
  if (typeof meta === "string" && meta.trim().length > 0) {
    return meta.trim();
  }
  return null;
}

export type ScriptureModuleAccessDeniedReason = "not_allowlisted" | "missing_email";

export type ScriptureModuleAccessResult =
  | { allowed: true; via: "allowlist" | "local_dev_bypass" }
  | { allowed: false; reason: ScriptureModuleAccessDeniedReason };

const ENV_LOCAL_DEV = "BADWR_SCRIPTURE_MODULE_LOCAL_DEV";
const ENV_ADMIN_EMAILS = "BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS";

/** Runtime env read — avoids compile-time replacement issues for custom keys. */
export function envString(key: string): string | undefined {
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

/** True only when running `next dev` (not `next build` / `next start`). */
export function isNextJsDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function readLocalDevBypassEnabled(): boolean {
  return isTruthyEnvString(envString(ENV_LOCAL_DEV));
}

export function readAdminEmailsRaw(): string | undefined {
  const raw = envString(ENV_ADMIN_EMAILS);
  return raw?.trim() || undefined;
}

/**
 * Single source of truth for /scripture access. Used by layout and server actions.
 *
 * Order: (1) dev + local bypass flag + email → allow; (2) allowlist match; else deny.
 */
export function evaluateScriptureModuleAccess(
  email: string | null | undefined
): ScriptureModuleAccessResult {
  const dev = isNextJsDevelopment();
  const localBypass = readLocalDevBypassEnabled();

  if (dev && localBypass) {
    if (email && typeof email === "string" && email.trim().length > 0) {
      return { allowed: true, via: "local_dev_bypass" };
    }
    return { allowed: false, reason: "missing_email" };
  }

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return { allowed: false, reason: "missing_email" };
  }

  const raw = readAdminEmailsRaw();
  if (!raw) {
    return { allowed: false, reason: "not_allowlisted" };
  }

  const allowed = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  if (allowed.has(email.trim().toLowerCase())) {
    return { allowed: true, via: "allowlist" };
  }

  return { allowed: false, reason: "not_allowlisted" };
}

/** Convenience for server actions and other call sites. */
export function isScriptureModuleOperatorEmail(email: string | null | undefined): boolean {
  return evaluateScriptureModuleAccess(email).allowed;
}
