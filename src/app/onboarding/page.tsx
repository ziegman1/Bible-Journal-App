import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { normalizeGrowthMode } from "@/lib/growth-mode/model";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";

export default async function OnboardingPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("display_name, reading_mode, journal_year, onboarding_complete, growth_mode")
    .eq("id", user.id)
    .single();

  // Backfill profile for users who signed up before handle_new_user trigger fix
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
      .select("display_name, reading_mode, journal_year, onboarding_complete, growth_mode")
      .eq("id", user.id)
      .single();
    profile = created ?? profile;
  }

  // Only skip onboarding if user explicitly completed it (submitted the form)
  if (profile?.onboarding_complete) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="sr-only">Welcome — set up your profile</h1>
          <div className="flex justify-center mb-6">
            <BadwrLogo variant="auth" priority />
          </div>
          <p className="text-center text-stone-600 dark:text-stone-400 mb-8">
            A few quick questions to personalize your experience
          </p>
          <OnboardingForm
            defaultDisplayName={profile?.display_name ?? ""}
            defaultReadingMode={(profile?.reading_mode as "canonical" | "chronological" | "custom" | "free_reading") ?? "canonical"}
            defaultJournalYear={profile?.journal_year ?? new Date().getFullYear()}
            defaultGrowthMode={normalizeGrowthMode(profile?.growth_mode)}
          />
        </div>
      </div>
      <div className="shrink-0 px-4 py-6 border-t border-border pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SiteFooter variant="compact" />
      </div>
    </div>
  );
}
