"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { generateInsightSummaryAction } from "@/app/actions/insights";
import { insightsAiSummaryIdleCopy } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import type { InsightSummaryJSON } from "@/lib/insights/types";
import type { InsightsDateRange } from "@/lib/insights/types";

interface InsightsAISummaryProps {
  range: InsightsDateRange;
  startDate: string;
  endDate: string;
  initialSummary: InsightSummaryJSON | null;
  copyTone?: GrowthCopyTone;
}

export function InsightsAISummary({
  range,
  startDate: _startDate,
  endDate: _endDate,
  initialSummary,
  copyTone = "accountability",
}: InsightsAISummaryProps) {
  const [summary, setSummary] = useState<InsightSummaryJSON | null>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateInsightSummaryAction(range);
    setLoading(false);
    if (result.success) {
      setSummary(result.summary);
    } else {
      setError(result.error);
    }
  }

  return (
    <Card className="bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600 dark:text-amber-500" />
          AI Reflection
        </CardTitle>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          A synthesized reflection based on your journaling in this period
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!summary && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {insightsAiSummaryIdleCopy(copyTone)}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" />
                  Generate AI Summary
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                Headline
              </h3>
              <p className="text-lg font-serif font-light text-stone-800 dark:text-stone-200">
                {summary.headline}
              </p>
            </div>

            {summary.recurringThemes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Recurring Themes
                </h3>
                <ul className="space-y-1">
                  {summary.recurringThemes.map((t, i) => (
                    <li key={i} className="text-sm text-stone-700 dark:text-stone-300">
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.keyLearnings.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Key Learnings
                </h3>
                <ul className="space-y-1">
                  {summary.keyLearnings.map((l, i) => (
                    <li key={i} className="text-sm text-stone-700 dark:text-stone-300">
                      • {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.prayerPatterns && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Prayer Patterns
                </h3>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {summary.prayerPatterns}
                </p>
              </div>
            )}

            {summary.applicationPatterns && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Application Patterns
                </h3>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {summary.applicationPatterns}
                </p>
              </div>
            )}

            {summary.spiritualTrajectory && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Spiritual Trajectory
                </h3>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {summary.spiritualTrajectory}
                </p>
              </div>
            )}

            {summary.encouragement && (
              <div className="rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/20 p-4">
                <h3 className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Encouragement
                </h3>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {summary.encouragement}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              className="border-amber-200 dark:border-amber-800"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="size-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
