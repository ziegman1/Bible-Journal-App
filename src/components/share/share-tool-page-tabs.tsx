"use client";

import { useState } from "react";
import { ShareEncounterLogSheet } from "@/components/share/share-encounter-log-sheet";
import { WeeklyRhythmGoalsForm } from "@/components/share/weekly-rhythm-goals-form";
import { shareToolPageIntro } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone, GrowthMode } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

type TabId = "log" | "options";

export function ShareToolPageTabs({
  weeklyShareGoalEncounters,
  weeklyPrayerGoalMinutes,
  growthMode,
  copyTone,
  goalPhrase,
}: {
  weeklyShareGoalEncounters: number;
  weeklyPrayerGoalMinutes: number;
  growthMode: GrowthMode;
  copyTone: GrowthCopyTone;
  goalPhrase: string;
}) {
  const [tab, setTab] = useState<TabId>("log");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Share tools"
        className="flex gap-1 rounded-lg border border-stone-200/90 bg-stone-50/80 p-1 dark:border-stone-800 dark:bg-stone-900/40"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "log"}
          id="share-tab-log"
          aria-controls="share-panel-log"
          onClick={() => setTab("log")}
          className={cn(
            "min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            tab === "log"
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          )}
        >
          Log a share
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "options"}
          id="share-tab-options"
          aria-controls="share-panel-options"
          onClick={() => setTab("options")}
          className={cn(
            "min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            tab === "options"
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          )}
        >
          Options
        </button>
      </div>

      {tab === "log" ? (
        <div id="share-panel-log" role="tabpanel" aria-labelledby="share-tab-log" className="space-y-4">
          <p className="text-sm text-muted-foreground">{shareToolPageIntro(copyTone, goalPhrase)}</p>
          <ShareEncounterLogSheet
            weeklyShareGoalEncounters={weeklyShareGoalEncounters}
            copyTone={copyTone}
          />
        </div>
      ) : (
        <div id="share-panel-options" role="tabpanel" aria-labelledby="share-tab-options">
          <WeeklyRhythmGoalsForm
            key={`${weeklyShareGoalEncounters}-${weeklyPrayerGoalMinutes}-${growthMode}`}
            growthMode={growthMode}
            weeklyShareGoalEncounters={weeklyShareGoalEncounters}
            weeklyPrayerGoalMinutes={weeklyPrayerGoalMinutes}
          />
        </div>
      )}
    </div>
  );
}
