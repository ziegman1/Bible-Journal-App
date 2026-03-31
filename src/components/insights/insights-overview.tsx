import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BookMarked, MessageSquare, MessageCircle } from "lucide-react";
import {
  insightsOverviewReflectionLine,
  insightsOverviewStatLabels,
} from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import type { InsightsSummary } from "@/lib/insights/types";

interface InsightsOverviewProps {
  data: InsightsSummary;
  copyTone?: GrowthCopyTone;
}

export function InsightsOverview({ data, copyTone = "accountability" }: InsightsOverviewProps) {
  const { overview } = data;
  const reflection = insightsOverviewReflectionLine(copyTone);
  const labels = insightsOverviewStatLabels(copyTone);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200">
          Overview
        </CardTitle>
        {reflection ? (
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{reflection}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-stone-900/50 p-4">
            <BookMarked className="size-5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="text-2xl font-light text-stone-800 dark:text-stone-200">
                {overview.totalJournalEntries}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {labels.journal}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-stone-900/50 p-4">
            <MessageSquare className="size-5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="text-2xl font-light text-stone-800 dark:text-stone-200">
                {overview.totalStudyThreads}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {labels.threads}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-stone-900/50 p-4">
            <MessageCircle className="size-5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="text-2xl font-light text-stone-800 dark:text-stone-200">
                {overview.totalAIQuestions}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {labels.aiQuestions}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-stone-900/50 p-4">
            <BookOpen className="size-5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="text-2xl font-light text-stone-800 dark:text-stone-200">
                {overview.booksStudiedCount}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {labels.books}
              </p>
            </div>
          </div>
        </div>
        {overview.booksStudied.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              Books in this period
            </p>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {overview.booksStudied.join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
