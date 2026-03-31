import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getSoapsWeeklyPace } from "@/app/actions/soaps-weekly-pace";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { SOAPS_WEEKLY_GOAL_SESSIONS } from "@/lib/dashboard/soaps-weekly-constants";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const soapCard =
  "border-sky-200/50 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 dark:border-sky-500/15 dark:from-card dark:via-sky-950/15 dark:to-blue-950/10";
const soapHover =
  "hover:border-sky-300/70 hover:shadow-[0_4px_20px_-4px_rgba(56,189,248,0.15)] dark:hover:border-sky-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(56,189,248,0.08)]";
const soapLabel = "text-sky-700/70 dark:text-sky-400/60";
const soapIconBg =
  "bg-sky-100/70 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400";

export async function SoapsDashboardPracticeCard({
  toolsOnly = false,
  copyTone = "accountability",
}: {
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
} = {}) {
  if (toolsOnly) {
    return (
      <Link
        href="/app/soaps"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          soapCard,
          soapHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              soapLabel
            )}
          >
            SOAPS
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              soapIconBg
            )}
          >
            <BookOpen className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Scripture, observation, application, prayer, share.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Open SOAPS whenever you’re ready—the practice is what matters here.</p>
        </div>
      </Link>
    );
  }

  const pace = await getSoapsWeeklyPace();

  if ("error" in pace) {
    return (
      <Link
        href="/app/soaps"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          soapCard,
          soapHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              soapLabel
            )}
          >
            SOAPS
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              soapIconBg
            )}
          >
            <BookOpen className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Scripture, observation, application, prayer, share.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Sign in to see your weekly SOAPS pace.</p>
        </div>
      </Link>
    );
  }

  const paceMessage = paceMessageForTone(pace.message, copyTone);
  const ariaDesc = `${paceMessage} ${pace.expectedSoFar} sessions expected so far this week toward ${SOAPS_WEEKLY_GOAL_SESSIONS}; you have completed ${pace.actual}.`;

  return (
    <Link
      href="/app/soaps"
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        soapCard,
        soapHover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", soapLabel)}
        >
          SOAPS
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            soapIconBg
          )}
        >
          <BookOpen className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Scripture, observation, application, prayer, share.
      </p>

      <div className="mt-2 border-t border-border/60 pt-2">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={pace.needleDegrees}
          status={pace.status}
          message={paceMessage}
          detailLineCompact={`${pace.expectedSoFar} expected · ${pace.actual} done · day ${pace.daysElapsed} of 7 · goal ${SOAPS_WEEKLY_GOAL_SESSIONS}/wk`}
          ariaDescription={ariaDesc}
        />
      </div>
    </Link>
  );
}
