import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { InsightsSummary } from "@/lib/insights/types";

interface InsightsJournalingActivityProps {
  data: InsightsSummary;
}

export function InsightsJournalingActivity({ data }: InsightsJournalingActivityProps) {
  const { frequencyByMonth, frequencyByWeek } = data.journalingActivity;
  const maxMonth = Math.max(1, ...frequencyByMonth.map((f) => f.count));
  const maxWeek = Math.max(1, ...frequencyByWeek.map((f) => f.count));

  if (frequencyByMonth.length === 0 && frequencyByWeek.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Calendar className="size-4" />
            Journaling Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No journal entries in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-serif font-light text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Calendar className="size-4" />
          Journaling Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {frequencyByMonth.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-3">
              By month
            </p>
            <div className="flex flex-wrap gap-2 items-end">
              {frequencyByMonth.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 min-h-[4px] rounded-t bg-amber-200 dark:bg-amber-800/50 transition-all"
                    style={{
                      height: `${Math.max(4, (f.count / maxMonth) * 48)}px`,
                    }}
                  />
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">
                    {f.label.slice(5)}
                  </span>
                  <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300">
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {frequencyByWeek.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-3">
              By week (recent)
            </p>
            <ul className="space-y-1.5">
              {frequencyByWeek.slice(-6).map((f) => (
                <li
                  key={f.label}
                  className="flex justify-between text-sm text-stone-700 dark:text-stone-300"
                >
                  <span>{f.label}</span>
                  <span className="text-stone-500 dark:text-stone-400">{f.count} entries</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
