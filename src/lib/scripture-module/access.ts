/**
 * Scripture module access + dev-only debug snapshot (uses `process.cwd()` — Node only).
 * For Edge / middleware, import from `./access-eval` instead.
 */

export * from "./access-eval";

import type { ScriptureModuleAccessResult } from "./access-eval";
import {
  envString,
  isNextJsDevelopment,
  readAdminEmailsRaw,
  readLocalDevBypassEnabled,
} from "./access-eval";

const ENV_LOCAL_DEV = "BADWR_SCRIPTURE_MODULE_LOCAL_DEV";
const ENV_ADMIN_EMAILS = "BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS";

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
