import Link from "next/link";
import { Heart } from "lucide-react";
import { getPrayerWheelDashboardStats } from "@/app/actions/prayer-wheel";
import { cn } from "@/lib/utils";

const prayCard =
  "border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-purple-50/25 dark:border-violet-500/15 dark:from-card dark:via-violet-950/15 dark:to-purple-950/10";
const prayHover =
  "hover:border-violet-300/70 hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.15)] dark:hover:border-violet-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.08)]";
const prayLabel = "text-violet-700/70 dark:text-violet-400/60";
const prayIconBg =
  "bg-violet-100/70 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400";

/** Semicircle arc length for r=40: π * 40 */
const ARC_LEN = 40 * Math.PI;

function PrayerfulnessGauge({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  const offset = ARC_LEN * (1 - p / 100);
  return (
    <svg viewBox="0 0 100 58" className="h-14 w-full max-w-[140px]" aria-hidden>
      <path
        d="M 12 52 A 40 40 0 0 1 88 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        className="text-border"
      />
      <path
        d="M 12 52 A 40 40 0 0 1 88 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        className="text-violet-600 dark:text-violet-400"
        strokeDasharray={ARC_LEN}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export async function PrayDashboardPracticeCard() {
  const stats = await getPrayerWheelDashboardStats();

  if ("error" in stats) {
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
          Prayer wheel, lists, and focused time. Open to begin.
        </p>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Sign in to track weekly prayer time.</p>
        </div>
      </Link>
    );
  }

  const { weeklyMinutes, prayerfulnessPercent, weeklyGoalMinutes, fullWheelsThisWeek } = stats;

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
        Prayer Wheel: twelve guided segments with a timer.
      </p>

      <div className="mt-3 flex flex-col items-center gap-1 border-t border-border/60 pt-3">
        <PrayerfulnessGauge percent={prayerfulnessPercent} />
        <p className="text-center text-xs font-medium text-foreground">
          Prayerfulness · {prayerfulnessPercent}%
        </p>
        <p className="text-center text-[11px] text-muted-foreground">
          {weeklyMinutes} min this week
          {weeklyGoalMinutes > 0 ? ` · goal ${weeklyGoalMinutes} min` : ""}
          {fullWheelsThisWeek > 0
            ? ` · ${fullWheelsThisWeek} full wheel${fullWheelsThisWeek === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>
    </Link>
  );
}
