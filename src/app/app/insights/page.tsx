import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { aggregateInsights, getDateBounds } from "@/lib/insights/aggregate";
import { getCachedInsightSummary } from "@/app/actions/insights";
import type { InsightsDateRange } from "@/lib/insights/types";
import { InsightsDateRangeSelect } from "@/components/insights/insights-date-range";
import { InsightsOverview } from "@/components/insights/insights-overview";
import { InsightsThemes } from "@/components/insights/insights-themes";
import { InsightsBooksPassages } from "@/components/insights/insights-books-passages";
import { InsightsJournalingActivity } from "@/components/insights/insights-journaling-activity";
import { InsightsKeywords } from "@/components/insights/insights-keywords";
import { InsightsAISummary } from "@/components/insights/insights-ai-summary";

interface PageProps {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const range = (params.range as InsightsDateRange) ?? "last30";
  const bounds = getDateBounds(range, params.start ?? undefined, params.end ?? undefined);

  const [summary, cachedResult] = await Promise.all([
    aggregateInsights(supabase, user.id, bounds),
    getCachedInsightSummary(range, bounds.start, bounds.end),
  ]);

  const cachedSummary =
    cachedResult && "summary" in cachedResult ? cachedResult.summary : null;

  return (
    <div className="min-h-screen bg-stone-50/30 dark:bg-stone-950/30">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
              Insights
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              A reflection on your journaling journey
            </p>
          </div>
          <InsightsDateRangeSelect />
        </header>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          {bounds.start} — {bounds.end}
        </p>

        <section className="space-y-6">
          <InsightsOverview data={summary} />
          <InsightsThemes data={summary} />
          <InsightsBooksPassages data={summary} />
          <InsightsJournalingActivity data={summary} />
          <InsightsKeywords data={summary} />
          <InsightsAISummary
            range={range}
            startDate={bounds.start}
            endDate={bounds.end}
            initialSummary={cachedSummary}
          />
        </section>
      </div>
    </div>
  );
}
