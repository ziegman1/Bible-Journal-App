import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";

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
    .select("display_name, reading_mode, journal_year, onboarding_complete")
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
      .select("display_name, reading_mode, journal_year, onboarding_complete")
      .eq("id", user.id)
      .single();
    profile = created ?? profile;
  }

  // Only skip onboarding if user explicitly completed it (submitted the form)
  if (profile?.onboarding_complete) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-serif font-light text-center text-stone-800 dark:text-stone-200 mb-8">
          Welcome to Bible Journal
        </h1>
        <p className="text-center text-stone-600 dark:text-stone-400 mb-8">
          A few quick questions to personalize your experience
        </p>
        <OnboardingForm
          defaultDisplayName={profile?.display_name ?? ""}
          defaultReadingMode={(profile?.reading_mode as "canonical" | "chronological" | "custom" | "free_reading") ?? "canonical"}
          defaultJournalYear={profile?.journal_year ?? new Date().getFullYear()}
        />
      </div>
    </div>
  );
}
