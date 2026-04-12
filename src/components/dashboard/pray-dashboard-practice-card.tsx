import Link from "next/link";
import { Heart } from "lucide-react";
import {
  getPrayerDashboardPracticeStats,
} from "@/app/actions/prayer-wheel";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const prayCard =
  "border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-purple-50/25 dark:border-violet-500/15 dark:from-card dark:via-violet-950/15 dark:to-purple-950/10";
const prayHover =
  "hover:border-violet-300/70 hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.15)] dark:hover:border-violet-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.08)]";
const prayLabel = "text-violet-700/70 dark:text-violet-400/60";
const prayIconBg =
  "bg-violet-100/70 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400";

export async function PrayDashboardPracticeCard({
  toolsOnly = false,
  copyTone = "accountability",
}: {
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
} = {}) {
  if (toolsOnly) {
    return (
      <Link
        href="/app/prayer"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          prayCard,
          prayHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              prayLabel
            )}
          >
            PRAY
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              prayIconBg
            )}
          >
            <Heart className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Prayer wheel, freestyle timer, and extra time. Open when you are ready.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Your rhythm matters more than a number on the home screen.</p>
        </div>
      </Link>
    );
  }

  const stats = await getPrayerDashboardPracticeStats();

  if ("error" in stats) {
    return (
      <Link
        href="/app/prayer/log"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          prayCard,
          prayHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              prayLabel
            )}
          >
            PRAY
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              prayIconBg
            )}
          >
            <Heart className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Prayer activity, streak, and log. Open to view.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Sign in to track prayer rhythm.</p>
        </div>
      </Link>
    );
  }

  const { streak, prayedToday, daysWithPrayerThisWeek, pace, onboardingPaceWeek } = stats;
  const paceMessage = paceMessageForTone(pace.message, copyTone);
  const streakLine =
    streak <= 0 ? "Start a streak today" : streak === 1 ? "1-day streak" : `${streak}-day streak`;
  const todayLine = prayedToday ? "Prayed today" : "Not yet today — there is still time";
  const ariaDesc = `${paceMessage} ${daysWithPrayerThisWeek} days with prayer so far this week toward showing up each day. Streak: ${streakLine}. ${todayLine}.`;

  return (
    <Link
      href="/app/prayer/log"
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        prayCard,
        prayHover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", prayLabel)}
        >
          PRAY
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            prayIconBg
          )}
        >
          <Heart className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {streakLine}
        <span className="text-muted-foreground"> · </span>
        {todayLine}
      </p>

      <div className="mt-2 border-t border-border/60 pt-2">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={pace.needleDegrees}
          status={pace.status}
          message={paceMessage}
          copyTone={copyTone}
          detailLineCompact={`${daysWithPrayerThisWeek} of 7 days with prayer${onboardingPaceWeek ? " · first week" : ""}`}
          ariaDescription={ariaDesc}
        />
      </div>
    </Link>
  );
}
