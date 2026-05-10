"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  GUIDED_JOURNEY_PHASE_TOOLS,
  isGuidedJourneyToolId,
  toolsUnlockedThroughPhase,
  type GuidedJourneyToolId,
} from "@/lib/app-experience-mode/guided-journey";
import {
  DEFAULT_JOURNEY_PROGRESS_V1,
  parseJourneyProgress,
  type JourneyProgressV1,
} from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";

function revalidateJourneyPaths() {
  revalidatePath("/app");
  revalidatePath("/app/journey");
  revalidatePath("/app/settings");
}

/** Replace journey JSON (internal / admin-style); prefer granular actions below for product flows. */
export async function saveJourneyProgressState(next: JourneyProgressV1) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (!canAccessGuidedJourney(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode")
    .eq("id", user.id)
    .maybeSingle();
  if (normalizeAppExperienceMode(profile?.app_experience_mode) !== "journey") {
    return { error: "Guided Journey is not active" as const };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneyPaths();
  return { success: true as const };
}

/** Set phase (1–5); unlocks merge with explicit `unlockedToolIds` in storage. */
export async function setGuidedJourneyPhase(phase: number) {
  const p = Math.max(1, Math.min(GUIDED_JOURNEY_PHASE_TOOLS.length, Math.floor(phase)));
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (!canAccessGuidedJourney(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();
  if (normalizeAppExperienceMode(profile?.app_experience_mode) !== "journey") {
    return { error: "Guided Journey is not active" as const };
  }

  const cur = parseJourneyProgress(profile?.journey_progress);
  const next: JourneyProgressV1 = {
    ...cur,
    currentPhase: p,
    unlockedToolIds: [...new Set([...cur.unlockedToolIds, ...toolsUnlockedThroughPhase(p)])],
  };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneyPaths();
  return { success: true as const };
}

/** Grant specific tools (mentor / manual / streak hook). Dedupes against defaults. */
export async function unlockGuidedJourneyTools(toolIds: string[]) {
  const tools = toolIds.filter(isGuidedJourneyToolId) as GuidedJourneyToolId[];
  if (tools.length === 0) return { error: "No valid tool ids" as const };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (!canAccessGuidedJourney(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();
  if (normalizeAppExperienceMode(profile?.app_experience_mode) !== "journey") {
    return { error: "Guided Journey is not active" as const };
  }

  const cur = parseJourneyProgress(profile?.journey_progress);
  const merged = new Set<string>([...DEFAULT_JOURNEY_PROGRESS_V1.unlockedToolIds, ...cur.unlockedToolIds]);
  for (const t of tools) merged.add(t);
  const next: JourneyProgressV1 = {
    ...cur,
    unlockedToolIds: [...merged],
  };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneyPaths();
  return { success: true as const };
}
