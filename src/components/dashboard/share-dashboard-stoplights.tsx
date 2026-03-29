import { Cross } from "lucide-react";
import type { ShareReceivedCounts } from "@/lib/dashboard/share-encounter-types";
import { cn } from "@/lib/utils";

export function ShareDashboardStoplights({
  counts,
  className,
}: {
  counts: ShareReceivedCounts;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Responses this week
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1">
          <span
            className="size-4 shrink-0 rounded-full bg-red-600 shadow-sm ring-1 ring-red-700/30 dark:ring-red-400/20"
            aria-hidden
          />
          <span className="text-[10px] text-muted-foreground">No</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{counts.red_light}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="size-4 shrink-0 rounded-full bg-amber-400 shadow-sm ring-1 ring-amber-600/25 dark:bg-amber-500"
            aria-hidden
          />
          <span className="text-[10px] text-muted-foreground">Maybe</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{counts.yellow_light}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="size-4 shrink-0 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-700/30 dark:ring-emerald-400/25"
            aria-hidden
          />
          <span className="text-[10px] text-muted-foreground">Yes</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{counts.green_light}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/30 py-2">
        <Cross className="size-5 text-foreground" strokeWidth={2.2} aria-hidden />
        <div className="text-center leading-tight">
          <span className="block text-[10px] text-muted-foreground">Already Christian</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {counts.already_christian}
          </span>
        </div>
      </div>
    </div>
  );
}
