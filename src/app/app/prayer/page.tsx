import Link from "next/link";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { PrayerToolsHub } from "@/components/prayer/prayer-tools-hub";
import { buttonVariants } from "@/components/ui/button-variants";
import { prayerToolPageIntro } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function PrayerPage() {
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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-20 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Prayer
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-serif font-light text-foreground">
            <Heart className="size-6 text-violet-600 dark:text-violet-400" />
            Prayer
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {prayerToolPageIntro(copyTone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/prayer/log"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Activity log
          </Link>
          <Link href="/app" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Dashboard
          </Link>
        </div>
      </div>

      <PrayerToolsHub />
    </div>
  );
}
