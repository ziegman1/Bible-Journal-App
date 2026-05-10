import Link from "next/link";
import { redirect } from "next/navigation";
import { JourneyInvitePageClient } from "@/components/journey/journey-invite-page-client";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  isLinearDiscipleshipPathGraduated,
  isSpiritualBreathingInviteGatherActive,
} from "@/lib/app-experience-mode/linear-discipleship-path";
import { parseJourneyProgress } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { createClient } from "@/lib/supabase/server";

export default async function JourneyInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode != null && mode !== "journey") {
    redirect("/app");
  }
  if (mode !== "journey") {
    redirect("/app");
  }

  const jp = parseJourneyProgress(profile?.journey_progress);
  const linear = jp.linearDiscipleshipPath;

  if (!linear || isLinearDiscipleshipPathGraduated(linear)) {
    redirect("/app/journey");
  }

  const blockingAfterSoaps = isSpiritualBreathingInviteGatherActive(linear);

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-stone-50/80 via-background to-background dark:from-stone-950/50 dark:via-background dark:to-background">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <JourneyInvitePageClient invites={linear.invitedPeople ?? []} blockingAfterSoaps={blockingAfterSoaps} />
        <div className="mt-10">
          <Link
            href="/app/journey"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-stone-600 dark:text-stone-400")}
          >
            ← Journey home
          </Link>
        </div>
      </div>
    </div>
  );
}
