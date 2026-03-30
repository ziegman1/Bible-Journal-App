import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BookMarked } from "lucide-react";
import type { InsightsSummary } from "@/lib/insights/types";

interface InsightsBooksPassagesProps {
  data: InsightsSummary;
}

export function InsightsBooksPassages({ data }: InsightsBooksPassagesProps) {
  const { topBooks, passagesMostRevisited, topChaptersReferenced } =
    data.booksAndPassages;

  const hasBooks = topBooks.length > 0;
  const hasPassages = passagesMostRevisited.length > 0;
  const hasChapters = topChaptersReferenced.length > 0;

  if (!hasBooks && !hasPassages && !hasChapters) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <BookOpen className="size-4" />
            Books and Passages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No book or passage data in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <BookOpen className="size-4" />
          Books and Passages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasBooks && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              Most engaged books
            </p>
            <ul className="space-y-1.5">
              {topBooks.slice(0, 8).map((b) => (
                <li
                  key={b.book}
                  className="flex justify-between text-sm text-stone-700 dark:text-stone-300"
                >
                  <span>{b.book}</span>
                  <span className="text-stone-500 dark:text-stone-400">{b.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasPassages && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1">
              <BookMarked className="size-3" />
              Passages most revisited
            </p>
            <ul className="space-y-1.5">
              {passagesMostRevisited.slice(0, 8).map((p) => (
                <li
                  key={p.reference}
                  className="flex justify-between text-sm text-stone-700 dark:text-stone-300"
                >
                  <span>{p.reference}</span>
                  <span className="text-stone-500 dark:text-stone-400">{p.count}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasChapters && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              Most referenced chapters
            </p>
            <ul className="space-y-1.5">
              {topChaptersReferenced.slice(0, 8).map((c) => (
                <li
                  key={`${c.book}-${c.chapter}`}
                  className="flex justify-between text-sm text-stone-700 dark:text-stone-300"
                >
                  <span>{c.book} {c.chapter}</span>
                  <span className="text-stone-500 dark:text-stone-400">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
