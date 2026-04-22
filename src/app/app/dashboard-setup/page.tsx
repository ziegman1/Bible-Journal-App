import { createClient } from "@/lib/supabase/server";
import { DashboardSetupForm } from "@/components/dashboard-setup/dashboard-setup-form";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { resolveCustomDashboardItemIds } from "@/lib/app-experience-mode/dashboard-items";

export default async function DashboardSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let initialSelected: ReturnType<typeof resolveCustomDashboardItemIds> = [];
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_experience_mode, custom_dashboard_items, custom_dashboard_modules")
      .eq("id", user.id)
      .maybeSingle();
    const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
    initialSelected = resolveCustomDashboardItemIds(
      mode,
      profile?.custom_dashboard_items,
      profile?.custom_dashboard_modules
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-2">
        Build your dashboard
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Pick which rhythms and tools you want. Each rhythm includes its streak and practice card
        together. The dashboard header and your Me / BADWR name always appear—you do not configure
        those here.
      </p>
      <DashboardSetupForm initialSelected={initialSelected} />
    </div>
  );
}
