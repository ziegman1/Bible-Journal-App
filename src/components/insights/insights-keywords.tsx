import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { InsightsSummary } from "@/lib/insights/types";

interface InsightsKeywordsProps {
  data: InsightsSummary;
}

export function InsightsKeywords({ data }: InsightsKeywordsProps) {
  const { topKeywords } = data.repeatedWords;

  if (topKeywords.length === 0) {
    return (
      <Card className="bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Sparkles className="size-4" />
            Repeated Words and Emphases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No reflection, prayer, or application text in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Sparkles className="size-4" />
          Repeated Words and Emphases
        </CardTitle>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Most common words from your reflections, prayers, and applications
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topKeywords.map((k) => (
            <span
              key={k.word}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 px-2.5 py-1 text-sm text-stone-700 dark:text-stone-300"
            >
              <span>{k.word}</span>
              <span className="text-xs text-amber-700 dark:text-amber-400">{k.count}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
