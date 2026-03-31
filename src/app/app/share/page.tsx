import Link from "next/link";
import { redirect } from "next/navigation";
import { ShareEncounterLogSheet } from "@/components/share/share-encounter-log-sheet";
import { buttonVariants } from "@/components/ui/button-variants";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { fetchUserRhythmGoals } from "@/lib/profile/rhythm-goals";
import { shareToolPageIntro } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function SharePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let weeklyShareGoalEncounters = DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS;
  let copyTone: GrowthCopyTone = "accountability";
  if (user) {
    const g = await fetchUserRhythmGoals(supabase, user.id);
    weeklyShareGoalEncounters = g.shareWeeklyGoalEncounters;
    copyTone = (await fetchUserGrowthPresentation(supabase, user.id)).copyTone;
  }

  const goalPhrase =
    weeklyShareGoalEncounters === 1
      ? "one person"
      : `${weeklyShareGoalEncounters} people`;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-light text-foreground">Share</h1>
        <p className="text-sm text-muted-foreground">
          {shareToolPageIntro(copyTone, goalPhrase)}
        </p>
      </div>
      <ShareEncounterLogSheet
        weeklyShareGoalEncounters={weeklyShareGoalEncounters}
        copyTone={copyTone}
      />
      <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        ← Dashboard
      </Link>
    </div>
  );
}
