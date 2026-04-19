import type { User } from "@supabase/supabase-js";

/**
 * Prefer JWT `email`; fall back to `user_metadata.email` (some providers omit top-level email).
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

/**
 * Access control for the hidden `/scripture` module (server-side only).
 *
 * Production: fail-closed allowlist via `BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS`.
 * Local: optional `BADWR_SCRIPTURE_MODULE_LOCAL_DEV=1` only when NODE_ENV=development.
 *
 * Important: read custom env vars via dynamic `process.env[key]` lookups.
 * Next.js may inline `process.env.SOME_CUSTOM_VAR` as `undefined` in the server
 * bundle when the name is not analyzable at compile time; dynamic access preserves
 * runtime values from `.env.local`. See Next.js "Environment Variables" bundling notes.
 *
 * See `.env.example` and `ScriptureModuleDevAccessDenied` (dev-only UI).
 */

export type ScriptureModuleAccessDeniedReason = "not_allowlisted" | "missing_email";

export type ScriptureModuleAccessResult =
  | { allowed: true; via: "allowlist" | "local_dev_bypass" }
  | { allowed: false; reason: ScriptureModuleAccessDeniedReason };

const ENV_LOCAL_DEV = "BADWR_SCRIPTURE_MODULE_LOCAL_DEV";
const ENV_ADMIN_EMAILS = "BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS";

/** Runtime env read — avoids compile-time replacement issues for custom keys. */
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

/** True only when running `next dev` (not `next build` / `next start`). */
export function isNextJsDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function readLocalDevBypassEnabled(): boolean {
  return isTruthyEnvString(envString(ENV_LOCAL_DEV));
}

function readAdminEmailsRaw(): string | undefined {
  const raw = envString(ENV_ADMIN_EMAILS);
  return raw?.trim() || undefined;
}

/**
 * Single source of truth for /scripture access. Used by layout and server actions.
 * Does not check auth or onboarding — callers must enforce those first.
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

/** Serializable snapshot for dev-only diagnostics (layout → dev access denied UI). */
export function getScriptureAccessDebugSnapshot(
  email: string | null | undefined,
  access: ScriptureModuleAccessResult
): {
  nodeEnv: string | undefined;
  processCwd: string;
  isNextJsDevelopment: boolean;
  localDevEnvRaw: string | undefined;
  localDevParsedEnabled: boolean;
  adminEmailsPresent: boolean;
  adminEmailsLength: number;
  signedInEmail: string | null;
  access: ScriptureModuleAccessResult;
  /** True when both scripture env keys are absent from process.env (after Next loads .env*). */
  badwrScriptureEnvVarsMissingFromProcess: boolean;
  /** Dev-only hint when vars are missing — not a substitute for fixing .env.local. */
  envDiagnosticNote: string | null;
} {
  const adminRaw = readAdminEmailsRaw();
  const localRaw = envString(ENV_LOCAL_DEV);
  const adminKeyPresent = envString(ENV_ADMIN_EMAILS) !== undefined;
  const localKeyPresent = envString(ENV_LOCAL_DEV) !== undefined;
  const bothKeysAbsentFromProcess = !localKeyPresent && !adminKeyPresent;
  return {
    nodeEnv: process.env.NODE_ENV,
    processCwd: process.cwd(),
    isNextJsDevelopment: isNextJsDevelopment(),
    localDevEnvRaw: localRaw,
    localDevParsedEnabled: readLocalDevBypassEnabled(),
    adminEmailsPresent: Boolean(adminRaw),
    adminEmailsLength: adminRaw?.length ?? 0,
    signedInEmail: email ?? null,
    access,
    badwrScriptureEnvVarsMissingFromProcess: bothKeysAbsentFromProcess,
    envDiagnosticNote: bothKeysAbsentFromProcess
      ? "BADWR_SCRIPTURE_MODULE_* keys are not in process.env. Add them to .env.local in the project root (same directory as package.json), save the file, then restart `npm run dev`. If you edited a copy elsewhere or another repo checkout, this file is not the one Next loads."
      : null,
  };
}
