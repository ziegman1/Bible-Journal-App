import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags } from "lucide-react";
import { insightsThemesEmptyCopy } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import type { InsightsSummary } from "@/lib/insights/types";

interface InsightsThemesProps {
  data: InsightsSummary;
  copyTone?: GrowthCopyTone;
}

export function InsightsThemes({ data, copyTone = "accountability" }: InsightsThemesProps) {
  const { topTags } = data.themesAndTags;

  if (topTags.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Tags className="size-4" />
            Themes and Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {insightsThemesEmptyCopy(copyTone)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Tags className="size-4" />
          Themes and Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topTags.map((t) => (
            <Link
              key={t.slug}
              href={`/app/journal?tag=${t.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white dark:bg-stone-900/50 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <span>{t.name}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
