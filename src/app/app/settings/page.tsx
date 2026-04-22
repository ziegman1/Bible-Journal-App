import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResetPracticeMetricsSettings } from "@/components/settings/reset-practice-metrics";
import { ExperienceModeSettings } from "@/components/settings/experience-mode-settings";
import { SettingsForm } from "@/components/settings-form";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES } from "@/lib/prayer-wheel/stats";
import { normalizeGrowthMode } from "@/lib/growth-mode/model";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, ai_style, growth_mode, weekly_share_goal_encounters, weekly_prayer_goal_minutes, app_experience_mode"
    )
    .eq("id", user.id)
    .single();

  const growthMode = normalizeGrowthMode(profile?.growth_mode);
  const experienceMode = normalizeAppExperienceMode(profile?.app_experience_mode) ?? "full";

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-6">
        Settings
      </h1>
      <SettingsForm
        displayName={profile?.display_name ?? ""}
        aiStyle={(profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced"}
        growthMode={growthMode}
        weeklyShareGoalEncounters={
          profile?.weekly_share_goal_encounters ?? DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS
        }
        weeklyPrayerGoalMinutes={
          profile?.weekly_prayer_goal_minutes ?? DEFAULT_PRAYER_WEEKLY_GOAL_MINUTES
        }
      />
      <ExperienceModeSettings key={experienceMode} currentMode={experienceMode} />
      <ResetPracticeMetricsSettings />
    </div>
  );
}
