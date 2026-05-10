import Link from "next/link";
import { redirect } from "next/navigation";
import { GuestShareHub } from "@/components/guest/guest-surfaces";
import { isGuestRequest } from "@/lib/guest/guest-request.server";
import { ShareEncounterLogSheet } from "@/components/share/share-encounter-log-sheet";
import { ShareToolPageTabs } from "@/components/share/share-tool-page-tabs";
import { buttonVariants } from "@/components/ui/button-variants";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { ANONYMOUS_SHARE_COPY_TONE, shareToolPageIntro } from "@/lib/growth-mode/copy";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";
import type { GrowthCopyTone, GrowthMode } from "@/lib/growth-mode/types";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function SharePage() {
  if (await isGuestRequest()) {
    return <GuestShareHub />;
  }

  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let weeklyShareGoalEncounters = DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS;
  let weeklyPrayerGoalMinutes = 0;
  let copyTone: GrowthCopyTone = ANONYMOUS_SHARE_COPY_TONE;
  let growthMode: GrowthMode = "guided";

  if (user) {
    const g = await fetchUserRhythmGoals(supabase, user.id);
    weeklyShareGoalEncounters = g.shareWeeklyGoalEncounters;
    weeklyPrayerGoalMinutes = g.prayerWeeklyGoalMinutes;
    const presentation = await fetchUserGrowthPresentation(supabase, user.id);
    copyTone = presentation.copyTone;
    growthMode = presentation.mode;
  }

  const goalPhrase =
    weeklyShareGoalEncounters === 1
      ? "one person"
      : `${weeklyShareGoalEncounters} people`;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-light text-foreground">Share</h1>
      </div>
      {user ? (
        <ShareToolPageTabs
          weeklyShareGoalEncounters={weeklyShareGoalEncounters}
          weeklyPrayerGoalMinutes={weeklyPrayerGoalMinutes}
          growthMode={growthMode}
          copyTone={copyTone}
          goalPhrase={goalPhrase}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {shareToolPageIntro(copyTone, goalPhrase)}
          </p>
          <ShareEncounterLogSheet
            weeklyShareGoalEncounters={weeklyShareGoalEncounters}
            copyTone={copyTone}
          />
        </div>
      )}
      <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Dashboard
      </Link>
    </div>
  );
}
