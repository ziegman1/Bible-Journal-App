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
import { insightsPageSubtitle } from "@/lib/growth-mode/copy";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";

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
  const range = (params.range as InsightsDateRange) ?? "thisYear";
  const bounds = getDateBounds(range, params.start ?? undefined, params.end ?? undefined);

  const [summary, cachedResult, growthPresentation] = await Promise.all([
    aggregateInsights(supabase, user.id, bounds),
    getCachedInsightSummary(range, bounds.start, bounds.end),
    fetchUserGrowthPresentation(supabase, user.id),
  ]);

  const cachedSummary =
    cachedResult && "summary" in cachedResult ? cachedResult.summary : null;
  const copyTone = growthPresentation.copyTone;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-light text-foreground">
              Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {insightsPageSubtitle(copyTone)}
            </p>
          </div>
          <InsightsDateRangeSelect />
        </header>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          {bounds.start} — {bounds.end}
        </p>

        <section className="space-y-6">
          <InsightsOverview data={summary} />
          <InsightsThemes data={summary} copyTone={copyTone} />
          <InsightsBooksPassages data={summary} copyTone={copyTone} />
          <InsightsJournalingActivity data={summary} copyTone={copyTone} />
          <InsightsKeywords data={summary} copyTone={copyTone} />
          <InsightsAISummary
            range={range}
            startDate={bounds.start}
            endDate={bounds.end}
            initialSummary={cachedSummary}
            copyTone={copyTone}
          />
        </section>
      </div>
    </div>
  );
}
