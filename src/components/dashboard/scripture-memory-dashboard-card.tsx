import Link from "next/link";
import { ScrollText } from "lucide-react";
import {
  getScriptureMemoryDailyCompletionGauge,
  getScriptureMemoryDashboardBundle,
} from "@/app/actions/scripture-memory";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { ScriptureMemoryProgressBars } from "@/components/scripture-memory/scripture-memory-progress-bars";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const cardClass =
  "border-emerald-200/50 bg-gradient-to-br from-white via-emerald-50/35 to-teal-50/25 dark:border-emerald-500/15 dark:from-card dark:via-emerald-950/15 dark:to-teal-950/10";
const hoverClass =
  "hover:border-emerald-300/70 hover:shadow-[0_4px_20px_-4px_rgba(52,211,153,0.15)] dark:hover:border-emerald-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(52,211,153,0.08)]";
const labelClass = "text-emerald-700/70 dark:text-emerald-400/60";
const iconBg = "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";

export async function ScriptureMemoryDashboardCard({
  toolsOnly = false,
  copyTone = "accountability",
}: {
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
} = {}) {
  if (toolsOnly) {
    return (
      <Link
        href="/app/scripture-memory"
        className={cn(
          "group flex min-h-[168px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          cardClass,
          hoverClass,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", labelClass)}
          >
            SCRIPTURE
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              iconBg
            )}
          >
            <ScrollText className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          Memorize and review passages.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Open Scripture Memory when you’re ready.</p>
        </div>
      </Link>
    );
  }

  const [b, g] = await Promise.all([
    getScriptureMemoryDashboardBundle(),
    getScriptureMemoryDailyCompletionGauge(),
  ]);

  const hasGauge = !("error" in g);
  const paceMessage = hasGauge ? paceMessageForTone(g.message, copyTone) : "Scripture Memory completion unavailable.";
  const ariaDesc = hasGauge
    ? `${paceMessage} Overall daily completion: ${g.memoryActiveDays} active days of ${g.totalDays} days since start (${g.completionPercent}%).`
    : "Completion data unavailable.";

  return (
    <Link
      href="/app/scripture-memory"
      className={cn(
        "group flex min-h-[168px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        cardClass,
        hoverClass,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", labelClass)}
        >
          SCRIPTURE
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            iconBg
          )}
        >
          <ScrollText className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Memorize and review passages—gauge shows days with memory activity vs all days since start.
      </p>

      {hasGauge ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <PaceNeedleMeter
            variant="compact"
            needleDegrees={g.needleDegrees}
            status={g.status}
            message={paceMessage}
            copyTone={copyTone}
            detailLineCompact={`Overall daily completion · ${g.completionPercent}% · ${g.memoryActiveDays}/${g.totalDays} days`}
            statusHeading="Daily completion"
            ariaDescription={ariaDesc}
          />
        </div>
      ) : null}

      <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
        <p className="text-xs text-muted-foreground">
          Streak:{" "}
          <span className="font-medium text-foreground">
            {b.streakDays} day{b.streakDays === 1 ? "" : "s"}
          </span>
          {" · "}
          Total:{" "}
          <span className="font-medium text-foreground">{b.currentTotalMemorized}</span>
        </p>
        <ScriptureMemoryProgressBars
          compact
          labelA="This month (new)"
          valueA={b.monthlyMemorized}
          goalA={b.monthlyGoal}
          ratioA={b.monthMeterRatio}
          labelB="Today (review)"
          valueB={b.todayReviewed}
          goalB={b.dailyReviewGoal}
          ratioB={b.dayMeterRatio}
        />
      </div>
    </Link>
  );
}
