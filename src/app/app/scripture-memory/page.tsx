import Link from "next/link";
import { redirect } from "next/navigation";
import { getScriptureMemoryPageData } from "@/app/actions/scripture-memory";
import { ScriptureMemoryLogForm } from "@/components/scripture-memory/scripture-memory-log-form";
import { ScriptureMemoryProgressBars } from "@/components/scripture-memory/scripture-memory-progress-bars";
import { ScriptureMemorySettingsPanel } from "@/components/scripture-memory/scripture-memory-settings-panel";
import { buttonVariants } from "@/components/ui/button-variants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ScriptureMemoryPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getScriptureMemoryPageData();
  if ("error" in data) {
    return (
      <div className="p-6">
        <p className="text-destructive">{data.error}</p>
      </div>
    );
  }

  const memToday = data.today?.memorized_new_count ?? 0;
  const revToday = data.today?.reviewed_count ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-light text-foreground">Scripture Memory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log new memorization and reviews. A day counts toward your streak when you log at least
            one new passage or one review. Monthly and daily meters use your practice timezone.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScriptureMemorySettingsPanel initial={data.settings} />
          <Link href="/app" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-light text-foreground">{data.streakDays}</p>
          <p className="text-xs text-muted-foreground">Day streak</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-light text-foreground">
            {data.settings.current_total_memorized}
          </p>
          <p className="text-xs text-muted-foreground">Total passages memorized</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Progress</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          New passages this calendar month vs monthly goal · reviews logged today vs daily goal
        </p>
        <div className="mt-4">
          <ScriptureMemoryProgressBars
            labelA="This month (new passages)"
            valueA={data.monthlyMemorized}
            goalA={data.settings.monthly_new_passages_goal}
            ratioA={data.monthMeterRatio}
            labelB="Today (reviews)"
            valueB={data.todayReviewed}
            goalB={data.settings.daily_review_goal}
            ratioB={data.dayMeterRatio}
          />
        </div>
      </div>

      <ScriptureMemoryLogForm
        key={`${data.settings.monthly_new_passages_goal}-${data.settings.daily_review_goal}-${data.todayYmd}`}
        practiceDateYmd={data.todayYmd}
        initialMemorized={memToday}
        initialReviewed={revToday}
        monthlyGoal={data.settings.monthly_new_passages_goal}
        dailyReviewGoal={data.settings.daily_review_goal}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recent activity (14 days)</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet—save today to begin.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {data.recent.map((r) => (
              <li key={r.practice_date} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span className="text-muted-foreground">{r.practice_date}</span>
                <span className="text-foreground">
                  +{r.memorized_new_count} new · {r.reviewed_count} review
                  {r.reviewed_count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
