import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { journeyProgressForMode } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";

/**
 * Guided Journey home — progressive unlocks read/write `profiles.journey_progress` (JSON).
 * Extend with step definitions and gating without changing the storage column name.
 */
export default async function JourneyHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let progressSummary = "Your path will unlock new tools as you complete each step.";
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_experience_mode, journey_progress")
      .eq("id", user.id)
      .maybeSingle();
    const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
    const jp = journeyProgressForMode(mode, profile?.journey_progress);
    if (jp) {
      const n = jp.completedStepIds.length;
      progressSummary =
        n === 0
          ? "Step 1 is ready when you are. Complete each step to unlock the next area of the app."
          : `You have completed ${n} journey step${n === 1 ? "" : "s"}. Keep going to unlock more tools.`;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Guided Journey
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{progressSummary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current focus</CardTitle>
          <CardDescription>
            Placeholder: wire steps to `journey_progress` (e.g. SOAPS intro, then prayer wheel, then
            community). Server actions can patch JSON and revalidate this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            For now you still have full navigation from the app shell. Tighten routing later by
            reading unlocked tool ids from `journey_progress.unlockedToolIds`.
          </p>
          <Link href="/app" className={cn(buttonVariants({ variant: "secondary" }))}>
            Open dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
