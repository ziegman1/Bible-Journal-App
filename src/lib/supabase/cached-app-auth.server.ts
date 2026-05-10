import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const LAYOUT_PROFILE_COLUMNS =
  "display_name, reading_mode, journal_year, onboarding_complete, app_experience_mode, custom_dashboard_items, custom_dashboard_modules, journey_progress";

/** Row shape returned by {@link resolveCachedAppLayoutAuth} (matches LAYOUT_PROFILE_COLUMNS). */
export type CachedAppLayoutProfile = {
  display_name: string | null;
  reading_mode: string | null;
  journal_year: number | null;
  onboarding_complete: boolean | null;
  app_experience_mode: string | null;
  custom_dashboard_items: unknown;
  custom_dashboard_modules: unknown;
  journey_progress: unknown;
};

export type CachedAppLayoutAuth = {
  supabase: SupabaseClient | null;
  user: User | null;
  profile: CachedAppLayoutProfile | null;
};

/**
 * Request-scoped auth + profile for `/app` layouts and journey gates.
 * Deduplicates `createClient` + `getUser` + `profiles` read (and backfill) across
 * `src/app/app/layout.tsx` and nested `JourneyToolGateLayout` in the same RSC pass.
 */
export const resolveCachedAppLayoutAuth = cache(async (): Promise<CachedAppLayoutAuth> => {
  const supabase = await createClient();
  if (!supabase) {
    return { supabase: null, user: null, profile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select(LAYOUT_PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: (user.user_metadata?.display_name as string) ?? "Reader",
      },
      { onConflict: "id" }
    );
    const { data: created } = await supabase
      .from("profiles")
      .select(LAYOUT_PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    profile = created ?? null;
  }

  return {
    supabase,
    user,
    profile: profile as CachedAppLayoutProfile | null,
  };
});
