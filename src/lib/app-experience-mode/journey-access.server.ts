import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { effectiveGuidedJourneyTools, isJourneyDeniedPath } from "@/lib/app-experience-mode/guided-journey";
import type { GuidedJourneyToolId } from "@/lib/app-experience-mode/guided-journey";
import { journeyProgressForMode } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";

export type JourneyGateRequirement = GuidedJourneyToolId | "deny";

/**
 * Enforces Guided Journey access for a route segment layout.
 * Skips work for non-journey users, invite accept flow, and facilitator present mode.
 */
export async function assertGuidedJourneyAccess(requirement: JourneyGateRequirement): Promise<void> {
  const h = await headers();
  if (h.get("x-invite-route") === "1" || h.get("x-facilitator-present") === "1") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode !== "journey") return;

  if (!canAccessGuidedJourney(user)) {
    redirect("/app");
  }

  if (requirement === "deny") {
    redirect("/app/journey");
  }

  const jp = journeyProgressForMode("journey", profile?.journey_progress);
  if (!jp) {
    redirect("/app/journey");
  }
  const unlocked = new Set(effectiveGuidedJourneyTools(jp));
  if (!unlocked.has(requirement)) {
    redirect("/app/journey");
  }
}

/** Call from layouts for segments that are always blocked in journey (process map, etc.). */
export async function assertGuidedJourneyNotBlockedPath(pathnamePrefix: string): Promise<void> {
  const h = await headers();
  if (h.get("x-invite-route") === "1" || h.get("x-facilitator-present") === "1") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode")
    .eq("id", user.id)
    .maybeSingle();

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode !== "journey") return;

  if (!canAccessGuidedJourney(user)) {
    redirect("/app");
  }

  if (isJourneyDeniedPath(pathnamePrefix)) {
    redirect("/app/journey");
  }
}
