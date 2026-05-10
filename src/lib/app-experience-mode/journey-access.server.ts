import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { navDiagServer } from "@/lib/debug/nav-diag";
import { effectiveGuidedJourneyTools, isJourneyDeniedPath } from "@/lib/app-experience-mode/guided-journey";
import type { GuidedJourneyToolId } from "@/lib/app-experience-mode/guided-journey";
import { journeyProgressForMode } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";
import { resolveCachedAppLayoutAuth } from "@/lib/supabase/cached-app-auth.server";

export type JourneyGateRequirement = GuidedJourneyToolId | "deny";

/**
 * Enforces Guided Journey access for a route segment layout.
 * Skips work for non-journey users, invite accept flow, and facilitator present mode.
 * Reuses {@link resolveCachedAppLayoutAuth} so auth/profile are not re-fetched after the root layout.
 */
export async function assertGuidedJourneyAccess(requirement: JourneyGateRequirement): Promise<void> {
  const t0 = Date.now();
  navDiagServer("journey_gate_start", { requirement });
  const h = await headers();
  if (h.get("x-invite-route") === "1" || h.get("x-facilitator-present") === "1") {
    navDiagServer("journey_gate_skip_headers", { requirement, ms: Date.now() - t0 });
    return;
  }

  const { supabase, user, profile } = await resolveCachedAppLayoutAuth();
  if (!supabase) return;
  if (!user) return;

  navDiagServer("journey_gate_after_profile", { requirement, ms: Date.now() - t0 });

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode !== "journey") {
    navDiagServer("journey_gate_pass_not_journey", { requirement, ms: Date.now() - t0 });
    return;
  }

  if (!canAccessGuidedJourney(user)) {
    navDiagServer("journey_gate_redirect_no_access", { requirement, to: "/app" });
    redirect("/app");
  }

  if (requirement === "deny") {
    navDiagServer("journey_gate_redirect_deny", { to: "/app/journey" });
    redirect("/app/journey");
  }

  const jp = journeyProgressForMode("journey", profile?.journey_progress);
  if (!jp) {
    navDiagServer("journey_gate_redirect_no_progress", { requirement, to: "/app/journey" });
    redirect("/app/journey");
  }
  const unlocked = new Set(effectiveGuidedJourneyTools(jp));
  if (!unlocked.has(requirement)) {
    navDiagServer("journey_gate_redirect_locked_tool", { requirement, to: "/app/journey" });
    redirect("/app/journey");
  }
  navDiagServer("journey_gate_pass", { requirement, ms: Date.now() - t0 });
}

/** Call from layouts for segments that are always blocked in journey (process map, etc.). */
export async function assertGuidedJourneyNotBlockedPath(pathnamePrefix: string): Promise<void> {
  const h = await headers();
  if (h.get("x-invite-route") === "1" || h.get("x-facilitator-present") === "1") {
    return;
  }

  const { supabase, user, profile } = await resolveCachedAppLayoutAuth();
  if (!supabase) return;
  if (!user) return;

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode !== "journey") return;

  if (!canAccessGuidedJourney(user)) {
    redirect("/app");
  }

  if (isJourneyDeniedPath(pathnamePrefix)) {
    redirect("/app/journey");
  }
}
