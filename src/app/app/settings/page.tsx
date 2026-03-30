import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, reading_mode, journal_year, ai_style")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-6">
        Settings
      </h1>
      <SettingsForm
        displayName={profile?.display_name ?? ""}
        readingMode={(profile?.reading_mode as "canonical" | "chronological" | "custom" | "free_reading") ?? "canonical"}
        journalYear={profile?.journal_year ?? new Date().getFullYear()}
        aiStyle={(profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced"}
      />
    </div>
  );
}
