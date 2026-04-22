"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AppExperienceMode } from "@/lib/app-experience-mode/types";
import { isAppExperienceMode, postExperienceModePath } from "@/lib/app-experience-mode/model";
import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { DASHBOARD_ITEM_IDS, isDashboardItemId } from "@/lib/app-experience-mode/dashboard-items";

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

  if (requireOnboarding) {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (fetchError || !profile?.onboarding_complete) {
      return { error: "Complete onboarding first" as const };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      app_experience_mode: mode,
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
