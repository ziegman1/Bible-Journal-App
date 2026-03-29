import Link from "next/link";
import { Heart } from "lucide-react";
import { ExtraPrayerMinutesForm } from "@/components/prayer/extra-prayer-minutes-form";
import { PrayerWheelTimer } from "@/components/prayer/prayer-wheel-timer";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function PrayerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-20 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Prayer
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-serif font-light text-foreground">
            <Heart className="size-6 text-violet-600 dark:text-violet-400" />
            Prayer Wheel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A guided hour with God, broken into twelve equal parts—praise, waiting, confession,
            Scripture, petition, intercession, praying the Word, thanksgiving, singing, meditation,
            listening, and closing praise. Choose how long each part runs; your completed segments
            add to this week&apos;s prayer time on the dashboard. You can also log extra prayer time
            below in 5-minute blocks.
          </p>
        </div>
        <Link href="/app" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Dashboard
        </Link>
      </div>

      <PrayerWheelTimer />

      <ExtraPrayerMinutesForm />
    </div>
  );
}
