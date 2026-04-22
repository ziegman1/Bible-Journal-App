import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { StartHereClient } from "@/components/start-here/start-here-client";
import { normalizeAppExperienceMode, postExperienceModePath } from "@/lib/app-experience-mode/model";

export default async function StartHerePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/start-here");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, app_experience_mode")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const mode = normalizeAppExperienceMode(profile.app_experience_mode);
  if (mode) {
    redirect(postExperienceModePath(mode));
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="flex-1 px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-center mb-6">
            <BadwrLogo variant="auth" priority />
          </div>
          <h1 className="text-center text-2xl sm:text-3xl font-serif font-light text-stone-800 dark:text-stone-100 mb-2">
            Start here
          </h1>
          <p className="text-center text-stone-600 dark:text-stone-400 mb-10 max-w-xl mx-auto text-sm sm:text-base">
            Choose how you want BADWR to meet you today. You can change this later in Settings.
          </p>
          <StartHereClient />
        </div>
      </div>
      <div className="shrink-0 border-t border-border px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SiteFooter variant="compact" />
      </div>
    </div>
  );
}
