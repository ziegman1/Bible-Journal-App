import type { User } from "@supabase/supabase-js";
import type { SoloLookUpMode } from "@/lib/groups/thirds-personal-types";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";

/** Query flags for admin QA — must only be honored when {@link isBadwrAdminTestUser} is true (server-enforced). */
export type AdminTestQueryPreview = {
  /** `testMode=1` or `adminTest=1` */
  testHarnessActive: boolean;
  /** `state=` — informational only unless a page opts in */
  state: string | null;
  /** `mode=dbs` | `mode=devotional` — used where pages implement UI-only overrides (e.g. Personal 3/3rds) */
  lookUpMode: SoloLookUpMode | null;
  /** `guestPreview=1` on URL; middleware may also force guest shell for admins */
  guestPreviewRequested: boolean;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function truthyTestMode(raw: string | undefined): boolean {
  if (!raw) return false;
  const t = raw.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}

/**
 * Parse admin test query params. Returns `null` when the viewer is not an authorized admin tester
 * (treat as no preview — never branch on queries for normal users).
 */
export function parseAdminTestToolQuery(
  searchParams: Record<string, string | string[] | undefined>,
  user: User | null | undefined
): AdminTestQueryPreview | null {
  if (!isBadwrAdminTestUser(user ?? null)) return null;

  const testHarnessActive =
    truthyTestMode(firstParam(searchParams.testMode)) ||
    truthyTestMode(firstParam(searchParams.adminTest));

  const guestPreviewRequested = firstParam(searchParams.guestPreview)?.trim() === "1";

  if (!testHarnessActive && !guestPreviewRequested) return null;

  const stateRaw = firstParam(searchParams.state)?.trim() ?? null;
  const modeRaw = firstParam(searchParams.mode)?.trim().toLowerCase() ?? null;
  let lookUpMode: SoloLookUpMode | null = null;
  if (modeRaw === "dbs") lookUpMode = "dbs";
  else if (modeRaw === "devotional") lookUpMode = "devotional";

  return {
    testHarnessActive,
    state: stateRaw && stateRaw.length > 0 ? stateRaw : null,
    lookUpMode,
    guestPreviewRequested,
  };
}

/** Human-readable fragment for the preview banner (client or server). */
export function formatAdminTestPreviewLabel(p: AdminTestQueryPreview | null, toolHint?: string): string {
  if (!p) return "";
  const parts: string[] = [];
  if (toolHint) parts.push(toolHint);
  if (p.state) parts.push(`state=${p.state}`);
  if (p.lookUpMode) parts.push(`mode=${p.lookUpMode}`);
  if (p.guestPreviewRequested) parts.push("guest preview");
  if (p.testHarnessActive) parts.push("test harness");
  return parts.join(" · ");
}
