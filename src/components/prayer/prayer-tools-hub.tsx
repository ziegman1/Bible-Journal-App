import Link from "next/link";
import { CircleDot, Clock, PenLine, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const cardClass = cn(
  "group block rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
  "hover:border-violet-300/80 hover:bg-muted/40",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "touch-manipulation"
);

/**
 * Prayer hub: navigates to dedicated routes for each tool (no inline expansion).
 */
export function PrayerToolsHub() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/app/prayer/wheel" className={cardClass}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500/15 dark:text-violet-400">
            <CircleDot className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium text-foreground">Prayer wheel</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              Twelve guided segments with optional chime and voice between steps.
            </span>
          </span>
        </div>
      </Link>

      <Link href="/app/prayer/oikos" className={cardClass}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500/15 dark:text-violet-400">
            <Users className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium text-foreground">Pray for your Oikos</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              Evangelistic prayer for up to five people from your List of 100.
            </span>
          </span>
        </div>
      </Link>

      <Link href="/app/prayer/freestyle" className={cardClass}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500/15 dark:text-violet-400">
            <PenLine className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium text-foreground">Freestyle prayer</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              Open-ended time with an optional short note when you finish.
            </span>
          </span>
        </div>
      </Link>

      <Link href="/app/prayer/extra" className={cardClass}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500/15 dark:text-violet-400">
            <Clock className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium text-foreground">Extra prayer time</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              Log additional minutes outside the wheel (e.g. walking prayer).
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
