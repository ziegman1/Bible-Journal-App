import type { SupabaseClient } from "@supabase/supabase-js";
import { getGrowthModePresentation, normalizeGrowthMode } from "@/lib/growth-mode/model";
import type { GrowthMode, GrowthModePresentation } from "@/lib/growth-mode/types";

export async function fetchUserGrowthMode(
  supabase: SupabaseClient,
  userId: string
): Promise<GrowthMode> {
  const { data } = await supabase
    .from("profiles")
    .select("growth_mode")
    .eq("id", userId)
    .maybeSingle();
  return normalizeGrowthMode(data?.growth_mode);
}

export async function fetchUserGrowthPresentation(
  supabase: SupabaseClient,
  userId: string
): Promise<GrowthModePresentation> {
  const mode = await fetchUserGrowthMode(supabase, userId);
  return getGrowthModePresentation(mode);
}
