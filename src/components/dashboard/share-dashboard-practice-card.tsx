import Link from "next/link";
import { Share2 } from "lucide-react";
import { getShareDashboardStats } from "@/app/actions/share-encounters";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { ShareDashboardStoplights } from "@/components/dashboard/share-dashboard-stoplights";
import { DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS } from "@/lib/dashboard/share-weekly-constants";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const shareCard =
  "border-amber-200/50 bg-gradient-to-br from-white via-amber-50/35 to-orange-50/25 dark:border-amber-500/15 dark:from-card dark:via-amber-950/15 dark:to-orange-950/10";
const shareHover =
  "hover:border-amber-300/70 hover:shadow-[0_4px_20px_-4px_rgba(251,191,36,0.15)] dark:hover:border-amber-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(251,191,36,0.08)]";
const shareLabel = "text-amber-700/70 dark:text-amber-400/60";
const shareIconBg =
  "bg-amber-100/70 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";

export async function ShareDashboardPracticeCard({
  toolsOnly = false,
  copyTone = "accountability",
}: {
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
} = {}) {
  if (toolsOnly) {
    return (
      <Link
        href="/app/share"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          shareCard,
          shareHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              shareLabel
            )}
          >
            SHARE
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              shareIconBg
            )}
          >
            <Share2 className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Log gospel and testimony conversations in your own words.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Each entry is a reminder of who God is bringing across your path—no tally needed here.</p>
        </div>
      </Link>
    );
  }

  const stats = await getShareDashboardStats();

  if ("error" in stats) {
    return (
      <Link
        href="/app/share"
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          shareCard,
          shareHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              shareLabel
            )}
          >
            SHARE
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              shareIconBg
            )}
          >
            <Share2 className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Log gospel and testimony conversations toward your weekly share goal (default{" "}
          {DEFAULT_SHARE_WEEKLY_GOAL_ENCOUNTERS} people).
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Sign in to track weekly share pace and responses.</p>
        </div>
      </Link>
    );
  }

  const {
    receivedCounts,
    weeklyGoal,
    pillarWeeksCounted,
    completionPercent,
    needleDegrees,
    status,
    message,
  } = stats;
  const paceMessage = paceMessageForTone(message, copyTone);
  const ariaDesc = `${paceMessage} Average weekly goal completion ${completionPercent}% across ${pillarWeeksCounted} pillar weeks (each week capped at 100%). Weekly goal ${weeklyGoal} encounters. This week’s responses: ${receivedCounts.red_light} no, ${receivedCounts.yellow_light} maybe, ${receivedCounts.green_light} yes, ${receivedCounts.already_christian} already Christian.`;

  return (
    <Link
      href="/app/share"
      className={cn(
        "group flex min-h-[220px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        shareCard,
        shareHover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", shareLabel)}
        >
          SHARE
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            shareIconBg
          )}
        >
          <Share2 className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {copyTone === "accountability" ? (
          <>
            Gospel, testimony, and responses—gauge shows average weekly goal completion ({weeklyGoal}
            /wk).
          </>
        ) : (
          <>Gospel, testimony, and how they responded—a gentle view of average weekly goal completion.</>
        )}
      </p>

      <div className="mt-3 border-t border-border/60 pt-3">
        <ShareDashboardStoplights counts={receivedCounts} />
      </div>

      <div className="mt-2 border-t border-border/60 pt-2">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={needleDegrees}
          status={status}
          message={paceMessage}
          copyTone={copyTone}
          detailLineCompact={`Avg weekly goal completion · ${completionPercent}% · ${pillarWeeksCounted} weeks · goal ${weeklyGoal}/wk`}
          statusHeading="Goal completion"
          ariaDescription={ariaDesc}
        />
      </div>
    </Link>
  );
}
