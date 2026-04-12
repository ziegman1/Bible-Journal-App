import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getPrayerActivityLogPageData } from "@/app/actions/prayer-wheel";
import { buttonVariants } from "@/components/ui/button-variants";
import { PRAYER_WHEEL_STEPS } from "@/lib/prayer-wheel/steps";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function formatLogWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PrayerActivityLogPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getPrayerActivityLogPageData();
  if ("error" in data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-destructive">{data.error}</p>
        <Link href="/app/prayer" className={cn(buttonVariants({ variant: "link" }), "mt-4 inline-flex")}>
          Back to prayer tools
        </Link>
      </div>
    );
  }

  const { streak, longestStreak, totalSessions, totalMinutesRounded, recent } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/app/prayer"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-4" />
          Prayer tools
        </Link>
        <Link href="/app" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Dashboard
        </Link>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Prayer
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-serif font-light text-foreground">
          <Heart className="size-6 text-violet-600 dark:text-violet-400" />
          Prayer activity
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A gentle record of how you have been showing up—not a score. Time is here for context, not
          comparison.
        </p>
      </div>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Current streak
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">
            {streak === 0 ? "—" : streak === 1 ? "1 day" : `${streak} days`}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Longest streak
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">
            {longestStreak === 0 ? "—" : longestStreak === 1 ? "1 day" : `${longestStreak} days`}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total sessions
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{totalSessions}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total time logged
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">
            {totalMinutesRounded < 0.1 && totalSessions === 0
              ? "—"
              : `${totalMinutesRounded} min`}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
        <p className="mt-1 text-xs text-muted-foreground">Last 30 days, newest first.</p>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {recent.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              When you use the wheel, freestyle prayer, Oikos prayer, or extra time, it will show up
              here.
            </li>
          ) : (
            recent.map((row, i) => (
              <li key={`${row.kind}-${row.atIso}-${i}`} className="px-4 py-3 text-sm">
                {row.kind === "wheel" ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-foreground">
                      Prayer wheel ·{" "}
                      {PRAYER_WHEEL_STEPS[row.stepIndex]?.title ?? `Segment ${row.stepIndex + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {row.durationMinutes} min · {formatLogWhen(row.atIso)}
                    </span>
                  </div>
                ) : row.kind === "extra" ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-foreground">Extra prayer time</span>
                    <span className="text-xs text-muted-foreground">
                      {row.minutes} min · {formatLogWhen(row.atIso)}
                    </span>
                  </div>
                ) : row.kind === "oikos" ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-foreground">Pray for your Oikos</span>
                    <span className="text-xs text-muted-foreground">{formatLogWhen(row.atIso)}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="text-foreground">Freestyle prayer</span>
                      <span className="text-xs text-muted-foreground">
                        {row.durationSeconds < 60
                          ? `${row.durationSeconds} sec`
                          : `${Math.round(row.durationSeconds / 60)} min`}{" "}
                        · {formatLogWhen(row.atIso)}
                      </span>
                    </div>
                    {row.note ? (
                      <p className="text-xs text-muted-foreground line-clamp-3">{row.note}</p>
                    ) : null}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
