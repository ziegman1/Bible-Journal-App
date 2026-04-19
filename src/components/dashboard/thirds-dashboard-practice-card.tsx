import Link from "next/link";
import { Users } from "lucide-react";
import { getThirdsWeeklyCompletionGauge } from "@/app/actions/thirds-weekly-completion-gauge";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const cardClass =
  "border-teal-200/50 bg-gradient-to-br from-white via-teal-50/35 to-cyan-50/25 dark:border-teal-500/15 dark:from-card dark:via-teal-950/15 dark:to-cyan-950/10";
const hoverClass =
  "hover:border-teal-300/70 hover:shadow-[0_4px_20px_-4px_rgba(45,212,191,0.15)] dark:hover:border-teal-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(45,212,191,0.08)]";
const labelClass = "text-teal-700/70 dark:text-teal-400/60";
const iconBg = "bg-teal-100/70 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400";

export async function ThirdsDashboardPracticeCard({
  toolsOnly = false,
  copyTone = "accountability",
}: {
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
} = {}) {
  if (toolsOnly) {
    return (
      <Link
        href="/app/groups"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          cardClass,
          hoverClass,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", labelClass)}>
            3/3rds
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              iconBg
            )}
          >
            <Users className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Solo or group rhythm—meetings and weekly finalize.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Open Groups when you’re ready; completion view stays optional.</p>
        </div>
      </Link>
    );
  }

  const gauge = await getThirdsWeeklyCompletionGauge();

  if ("error" in gauge) {
    return (
      <Link
        href="/app/groups"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          cardClass,
          hoverClass,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", labelClass)}>
            3/3rds
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              iconBg
            )}
          >
            <Users className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Could not load 3/3rds completion.</p>
      </Link>
    );
  }

  const paceMessage = paceMessageForTone(gauge.message, copyTone);
  const ariaDesc = `${paceMessage} ${gauge.hasParticipationStart ? `Participation started; ${gauge.participatedWeeks} of ${gauge.totalWeeks} weeks finalized.` : "Set a participation start in Groups to track week completion."}`;

  return (
    <Link
      href="/app/groups"
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        cardClass,
        hoverClass,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", labelClass)}>
          3/3rds
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            iconBg
          )}
        >
          <Users className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Weekly meeting rhythm—overall week completion since you started participating.
      </p>

      <div className="mt-2 border-t border-border/60 pt-2">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={gauge.needleDegrees}
          status={gauge.status}
          message={paceMessage}
          copyTone={copyTone}
          detailLineCompact={`Overall weekly completion · ${gauge.completionPercent}% · ${gauge.participatedWeeks}/${Math.max(1, gauge.totalWeeks)} weeks`}
          statusHeading="Weekly completion"
          ariaDescription={ariaDesc}
        />
      </div>
    </Link>
  );
}
