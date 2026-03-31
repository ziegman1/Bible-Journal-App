import Link from "next/link";
import { Heart } from "lucide-react";
import { getPrayerWheelDashboardStats } from "@/app/actions/prayer-wheel";
import { buildPrayerWheelWeeklyPace } from "@/lib/prayer-wheel/weekly-pace";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import { cn } from "@/lib/utils";

const prayCard =
  "border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-purple-50/25 dark:border-violet-500/15 dark:from-card dark:via-violet-950/15 dark:to-purple-950/10";
const prayHover =
  "hover:border-violet-300/70 hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.15)] dark:hover:border-violet-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(167,139,250,0.08)]";
const prayLabel = "text-violet-700/70 dark:text-violet-400/60";
const prayIconBg =
  "bg-violet-100/70 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400";

export async function PrayDashboardPracticeCard() {
  const [stats, tz] = await Promise.all([
    getPrayerWheelDashboardStats(),
    getPracticeTimeZone(),
  ]);

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
          <p>Sign in to track weekly prayer pace.</p>
        </div>
      </Link>
    );
  }

  const {
    weeklyMinutes,
    weeklyExtraMinutes,
    weeklyGoalMinutes,
    fullWheelsThisWeek,
  } = stats;
  const now = new Date();
  const pace = buildPrayerWheelWeeklyPace(weeklyMinutes, now, tz, weeklyGoalMinutes);
  const ariaDesc = `${pace.message} ${pace.expectedSoFar} minutes expected so far toward ${weeklyGoalMinutes}; you have logged ${pace.actual} minutes total. ${fullWheelsThisWeek} full wheel${fullWheelsThisWeek === 1 ? "" : "s"} this week.`;

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

      <div className="mt-2 border-t border-border/60 pt-2">
        <PaceNeedleMeter
          variant="compact"
          needleDegrees={pace.needleDegrees}
          status={pace.status}
          message={pace.message}
          detailLineCompact={`${pace.expectedSoFar} min expected · ${pace.actual} min total · day ${pace.daysElapsed} of 7 · goal ${weeklyGoalMinutes} min/wk${weeklyExtraMinutes > 0 ? ` · +${weeklyExtraMinutes} extra` : ""}${fullWheelsThisWeek > 0 ? ` · ${fullWheelsThisWeek} wheel${fullWheelsThisWeek === 1 ? "" : "s"}` : ""}`}
          ariaDescription={ariaDesc}
        />
      </div>
    </Link>
  );
}
