import Link from "next/link";
import { getThirdsParticipationStats } from "@/app/actions/thirds-personal";
import { ThirdsParticipationStartForm } from "@/components/groups/thirds-participation-start-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatParticipationWeekLong } from "@/lib/groups/participation-week-display";
import { cn } from "@/lib/utils";

export async function ThirdsParticipationPanel() {
  const stats = await getThirdsParticipationStats();

  const soloLink = (
    <Link
      href="/app/groups/personal-thirds"
      className={cn(buttonVariants({ size: "sm" }))}
    >
      Solo 3/3rds
    </Link>
  );

  if ("error" in stats) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              3/3rds participation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Look Back, Look Up, and Look Forward on your own when you are not in an app group.
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              Weekly stats did not load ({stats.error}). You can still open Solo 3/3rds. If this is
              new, run Supabase migration <span className="font-mono text-xs">041</span> for solo
              tracking tables.
            </p>
          </div>
          {soloLink}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            3/3rds participation
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your weekly 3/3rds rhythm. Finalize each week to add to your progress.
          </p>
        </div>
        {soloLink}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {stats.hasSettings && stats.totalWeeks > 0 ? (
          <>
            <span className="text-3xl font-semibold tabular-nums text-foreground">
              {stats.participatedWeeks}/{stats.totalWeeks}
            </span>
            <span className="text-sm text-muted-foreground">weeks with a finalized solo week</span>
            {stats.percent != null ? (
              <span className="text-sm font-medium text-foreground">({stats.percent}%)</span>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Set a start date below to see your running ratio (e.g. 12/14 weeks and percent).
          </p>
        )}
      </div>

      {stats.hasSettings && stats.participationStartedOn ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Tracking from the week of{" "}
          <span className="font-medium text-foreground">
            {formatParticipationWeekLong(stats.participationStartedOn)}
          </span>
          .
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        Informal groups completed (logged):{" "}
        <span className="font-medium text-foreground">{stats.informalGroupsCompleted}</span>
      </p>

      <ThirdsParticipationStartForm
        key={stats.participationStartedOn ?? "none"}
        hasSettings={stats.hasSettings}
        initialYmd={stats.participationStartedOn}
      />
    </section>
  );
}
