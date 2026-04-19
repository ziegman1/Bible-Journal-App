import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getChatWeeklyCompletionGauge } from "@/app/actions/chat-weekly-completion-gauge";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { paceMessageForTone } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

const chatCard =
  "border-indigo-200/50 bg-gradient-to-br from-white via-indigo-50/35 to-slate-50/30 dark:border-indigo-500/15 dark:from-card dark:via-indigo-950/15 dark:to-slate-950/10";
const chatHover =
  "hover:border-indigo-300/70 hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.15)] dark:hover:border-indigo-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.08)]";
const chatLabel = "text-indigo-700/70 dark:text-indigo-400/60";
const chatIconBg =
  "bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";

export async function ChatDashboardPracticeCard({
  groupId,
  toolsOnly = false,
  copyTone = "accountability",
}: {
  groupId: string;
  toolsOnly?: boolean;
  copyTone?: GrowthCopyTone;
}) {
  if (toolsOnly) {
    return (
      <Link
        href={`/app/chat/groups/${groupId}`}
        className={cn(
          "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
          chatCard,
          chatHover,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              chatLabel
            )}
          >
            CHAT
          </span>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              chatIconBg
            )}
          >
            <MessageCircle className="size-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
          Accountability group hub—meetings, reading, and conversation.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Open your group when it’s time to connect; reading pace stays out of the way here.</p>
        </div>
      </Link>
    );
  }

  const gauge = await getChatWeeklyCompletionGauge(groupId);
  const hasGauge = !("error" in gauge);

  const paceMessage = hasGauge ? paceMessageForTone(gauge.message, copyTone) : "";
  const ariaDesc = hasGauge
    ? `${paceMessage} Overall weekly completion: ${gauge.weeksWithCheckIn} pillar weeks with a reading check-in of ${gauge.totalPillarWeeks} since start (${gauge.completionPercent}%).`
    : "CHAT completion unavailable.";

  return (
    <Link
      href={`/app/chat/groups/${groupId}`}
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        chatCard,
        chatHover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.12em]",
            chatLabel
          )}
        >
          CHAT
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            chatIconBg
          )}
        >
          <MessageCircle className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Accountability group hub—gauge shows weeks with a reading check-in vs all pillar weeks since
        start.
      </p>

      {hasGauge ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <PaceNeedleMeter
            variant="compact"
            needleDegrees={gauge.needleDegrees}
            status={gauge.status}
            message={paceMessage}
            copyTone={copyTone}
            detailLineCompact={`Overall weekly completion · ${gauge.completionPercent}% · ${gauge.weeksWithCheckIn}/${gauge.totalPillarWeeks} weeks with check-in`}
            statusHeading="Weekly completion"
            ariaDescription={ariaDesc}
          />
        </div>
      ) : (
        <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Reading completion will show here when available.</p>
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground/80">Open meeting · log check-ins in Manage</p>
    </Link>
  );
}
