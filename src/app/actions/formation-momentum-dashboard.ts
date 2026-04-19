"use server";

/**
 * Server entry points for the formation-momentum engine on the dashboard.
 *
 * - `getFormationMomentumDashboard` — **live user-facing path**. Pass `{ includeExplain: true }` when the UI
 *   needs contributor lines (formation-momentum card + modals); otherwise omits explain to keep payloads small.
 * - `getFormationMomentumInspect` — **internal tuning / inspection** (`explain: true`); full JSON for `/app/formation-momentum-inspect`.
 *
 * Legacy BADWR cumulative snapshot (`getBadwrReproductionSnapshot`) remains in codebase for
 * settings adjustments and reference only — it is no longer the primary home metric driver.
 */

import { computeFormationMomentum } from "@/lib/metrics/formation-momentum/engine";
import type { MomentumSnapshot } from "@/lib/metrics/formation-momentum/types";
import { createClient } from "@/lib/supabase/server";

export type FormationMomentumDashboardResult =
  | { ok: true; snapshot: MomentumSnapshot }
  | { error: string };

export type GetFormationMomentumDashboardOptions = {
  /** When true, attaches `explain` for category contributor copy (same compute cost as inspect). */
  includeExplain?: boolean;
};

/** Primary live metric load for the app. */
export async function getFormationMomentumDashboard(
  options?: GetFormationMomentumDashboardOptions
): Promise<FormationMomentumDashboardResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const snapshot = await computeFormationMomentum(user.id, {
    explain: options?.includeExplain === true,
  });
  return { ok: true, snapshot };
}

/**
 * Full snapshot with `explain` for tuning (visit `/app/formation-momentum-inspect` or call from tools).
 * Not used by default dashboard surfaces.
 */
export async function getFormationMomentumInspect(): Promise<FormationMomentumDashboardResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const snapshot = await computeFormationMomentum(user.id, { explain: true });
  return { ok: true, snapshot };
}
