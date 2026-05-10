import Link from "next/link";
import { Calendar, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

function formatWeekStart(weekMondayYmd: string): string {
  const d = new Date(`${weekMondayYmd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return weekMondayYmd;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatInstant(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function GroupsHubPersonalJourneyCard({
  weeklyStreakLabel,
  lastFinalized,
  inProgressWeek,
}: {
  /** From identity streaks — same “3/3 weekly streak” label as dashboard. */
  weeklyStreakLabel: string;
  lastFinalized: { week_start_monday: string; finalized_at: string } | null;
  inProgressWeek: { week_start_monday: string } | null;
}) {
  const hasPersonalActivity = Boolean(lastFinalized || inProgressWeek);
  const ctaLabel = hasPersonalActivity ? "Continue Journey" : "Open Journey";

  const lastSessionLine = lastFinalized ? (
    <span className="flex flex-wrap items-center gap-1.5">
      <Calendar className="size-4 shrink-0" aria-hidden />
      Last solo week: {formatWeekStart(lastFinalized.week_start_monday)} · finalized{" "}
      {formatInstant(lastFinalized.finalized_at)}
    </span>
  ) : inProgressWeek ? (
    <span className="flex flex-wrap items-center gap-1.5">
      <Calendar className="size-4 shrink-0" aria-hidden />
      Week in progress — week of {formatWeekStart(inProgressWeek.week_start_monday)}
    </span>
  ) : (
    <span className="text-stone-500 dark:text-stone-400">
      No solo weeks yet — your journey starts with one guided week at a time.
    </span>
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-border",
        "bg-white dark:bg-stone-900/50",
        "transition-colors hover:border-stone-300 dark:hover:border-stone-700"
      )}
      aria-labelledby="personal-thirds-journey-heading"
    >
      <div className="flex items-start gap-2 p-6 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="personal-thirds-journey-heading"
              className="text-lg font-medium text-stone-800 dark:text-stone-200"
            >
              Your 3/3rds Journey
            </h2>
            <span className="rounded-full border border-sky-300/80 bg-sky-100/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
              Personal Journey
            </span>
          </div>
          <p className="mt-1 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">
            Look Back, Look Up, and Look Forward on your own rhythm—your weekly pathway alongside
            the groups you meet with below.
          </p>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium text-stone-700 dark:text-stone-300">Weekly rhythm: </span>
            {weeklyStreakLabel}
          </p>
        </div>
        <Footprints className="size-5 shrink-0 text-sky-500/80 dark:text-sky-400/80 hidden sm:block" aria-hidden />
      </div>

      <div className="block border-t border-border px-6 pb-6 pt-0">
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1 text-sm text-stone-600 dark:text-stone-400">{lastSessionLine}</div>
          <Link
            href="/app/groups/personal-thirds"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "w-full shrink-0 touch-manipulation sm:w-auto"
            )}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
