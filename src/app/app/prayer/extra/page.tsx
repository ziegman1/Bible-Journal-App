import Link from "next/link";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { ExtraPrayerMinutesForm } from "@/components/prayer/extra-prayer-minutes-form";
import { PrayerHubBackLink } from "@/components/prayer/prayer-hub-back-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ExtraPrayerTimePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let copyTone: GrowthCopyTone = "accountability";
  if (user) {
    copyTone = (await fetchUserGrowthPresentation(supabase, user.id)).copyTone;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PrayerHubBackLink />
        <Link href="/app" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Dashboard
        </Link>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Prayer
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-serif font-light text-foreground">
          <Heart className="size-6 text-violet-600 dark:text-violet-400" />
          Extra prayer time
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Log additional minutes outside the wheel (e.g. walking prayer).
        </p>
      </div>

      <ExtraPrayerMinutesForm copyTone={copyTone} />
    </div>
  );
}
