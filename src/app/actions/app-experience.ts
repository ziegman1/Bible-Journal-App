"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AppExperienceMode } from "@/lib/app-experience-mode/types";
import {
  isAppExperienceMode,
  normalizeAppExperienceMode,
  postExperienceModePath,
} from "@/lib/app-experience-mode/model";
import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { DASHBOARD_ITEM_IDS, isDashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { DEFAULT_JOURNEY_PROGRESS_V1 } from "@/lib/app-experience-mode/journey-progress";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";

function revalidateExperiencePaths() {
  revalidatePath("/start-here");
  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/journey");
  revalidatePath("/app/dashboard-setup");
  revalidatePath("/onboarding");
}

type PersistOptions = { requireOnboardingComplete?: boolean };

async function persistAppExperienceMode(mode: AppExperienceMode, options?: PersistOptions) {
  const requireOnboarding = options?.requireOnboardingComplete !== false;
  if (!isAppExperienceMode(mode)) {
    return { error: "Invalid experience mode" as const };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  if (mode === "journey" && !canAccessGuidedJourney(user)) {
    return { error: "Guided Journey is not available yet" as const };
  }

  let priorMode: ReturnType<typeof normalizeAppExperienceMode> = null;
  if (requireOnboarding) {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("onboarding_complete, app_experience_mode")
      .eq("id", user.id)
      .single();

    if (fetchError || !profile?.onboarding_complete) {
      return { error: "Complete onboarding first" as const };
    }
    priorMode = normalizeAppExperienceMode(profile?.app_experience_mode);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_experience_mode")
      .eq("id", user.id)
      .maybeSingle();
    priorMode = normalizeAppExperienceMode(profile?.app_experience_mode);
  }

  const enteringJourney = mode === "journey" && priorMode !== "journey";

  const { error } = await supabase
    .from("profiles")
    .update({
      app_experience_mode: mode,
      ...(enteringJourney ? { journey_progress: { ...DEFAULT_JOURNEY_PROGRESS_V1 } } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidateExperiencePaths();
  return { success: true as const };
}

/** First-run Start Here: returns `redirectTo` for the chosen path. */
export async function setAppExperienceMode(mode: AppExperienceMode) {
  const result = await persistAppExperienceMode(mode);
  if ("error" in result) return result;
  return { ...result, redirectTo: postExperienceModePath(mode) };
}

/** Settings (or other in-app flows): update mode without forcing navigation. */
export async function updateAppExperienceMode(mode: AppExperienceMode) {
  return persistAppExperienceMode(mode, { requireOnboardingComplete: true });
}

/** Persist tool-level dashboard selection (custom mode). Order follows `DASHBOARD_ITEM_IDS` for stable layout. */
export async function saveCustomDashboardItems(rawIds: unknown[]) {
  const picked = new Set<string>();
  for (const item of rawIds) {
    if (isDashboardItemId(item)) picked.add(item);
  }
  const ids: DashboardItemId[] = DASHBOARD_ITEM_IDS.filter((id) => picked.has(id));

  if (ids.length === 0) {
    return { error: "Select at least one dashboard item" as const };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { error } = await supabase
    .from("profiles")
    .update({
      custom_dashboard_items: ids,
      custom_dashboard_modules: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidateExperiencePaths();
  return { success: true as const };
}
