"use client";

/**
 * Formation momentum card — **phase-based UI**. Gauges visualize category progress via benchmarks → phases;
 * they do not surface raw engine masses or technical scoring details.
 */

import { CategoryPhaseGauge } from "@/components/dashboard/category-phase-gauge";
import { Dialog } from "@base-ui/react/dialog";
import type { CategoryId } from "@/lib/metrics/formation-momentum/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import * as React from "react";

const CATEGORY_LABEL: Record<CategoryId, string> = {
  foundation: "Foundation",
  formation: "Formation",
  reproduction: "Reproduction",
};

const CATEGORY_DESCRIPTION: Record<CategoryId, string> = {
  foundation:
    "Foundation is about time in the Word and prayer—building a base of hearing God and responding.",
  formation:
    "Formation is about being shaped in community—conversation and practices that grow you alongside others.",
  reproduction:
    "Reproduction is about passing it on—spiritual conversations and sharing faith with others.",
};

const GENERIC_WHY: Record<CategoryId, string> = {
  foundation: "This phase reflects your SOAPS, prayer, and scripture habits in the window we measured.",
  formation: "This phase reflects CHAT, 3/3rds, and related formation practices this week.",
  reproduction: "This phase reflects sharing and outward-focused habits this week.",
};

export type FormationMomentumRowVM = {
  category: CategoryId;
  phaseLabel: string;
  phaseLabels: readonly [string, string, string];
  phaseIndex: 0 | 1 | 2;
  needleT: number;
  positionSubtitle: string;
  /** Deduped practice insights for “why” (from explain) or empty → generic copy. */
  whyInsightLines: string[];
};

type Props = {
  rows: FormationMomentumRowVM[];
  summaryLine: string;
  signalCount: number;
  /** 1–2 prioritized suggestions from `computeNextBestSteps` (same for every category modal). */
  nextBestSteps: string[];
};

export function FormationMomentumCardInteractive({
  rows,
  summaryLine,
  signalCount,
  nextBestSteps,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<CategoryId | null>(null);

  const activeRow = active ? rows.find((r) => r.category === active) : undefined;

  function openCategory(cat: CategoryId) {
    setActive(cat);
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setActive(null);
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-4 border-t border-border/50 pt-3 sm:grid-cols-3 sm:gap-3">
        {rows.map((row) => (
          <button
            key={row.category}
            type="button"
            onClick={() => openCategory(row.category)}
            className={cn(
              "rounded-xl px-1 pb-1 text-left transition-colors",
              "hover:bg-indigo-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50",
              "dark:hover:bg-indigo-950/30"
            )}
            aria-label={`${CATEGORY_LABEL[row.category]}, ${row.phaseLabel} phase. Open details.`}
          >
            <CategoryPhaseGauge
              category={row.category}
              phaseLabel={row.phaseLabel}
              phaseLabels={row.phaseLabels}
              needleT={row.needleT}
              positionSubtitle={row.positionSubtitle}
              phaseIndex={row.phaseIndex}
            />
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-xs leading-snug text-foreground">{summaryLine}</p>

      <p className="mt-3 border-t border-border/50 pt-2 text-center text-[10px] text-muted-foreground">
        <span className="opacity-80">{signalCount} weekly signals</span>
      </p>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-50 bg-black/15 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/40",
              "supports-backdrop-filter:backdrop-blur-[2px]"
            )}
          />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,560px)] w-[min(100vw-2rem,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-4 shadow-xl",
              "transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0"
            )}
          >
            {activeRow ? (
              <>
                <div className="flex items-start justify-between gap-2 pr-8">
                  <Dialog.Title className="text-base font-semibold text-foreground">
                    {CATEGORY_LABEL[activeRow.category]}
                  </Dialog.Title>
                  <Dialog.Close
                    render={
                      <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3 shrink-0" />
                    }
                  >
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {CATEGORY_DESCRIPTION[activeRow.category]}
                </Dialog.Description>

                <div className="mt-4 flex flex-col items-center rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                  <CategoryPhaseGauge
                    category={activeRow.category}
                    phaseLabel={activeRow.phaseLabel}
                    phaseLabels={activeRow.phaseLabels}
                    needleT={activeRow.needleT}
                    positionSubtitle={activeRow.positionSubtitle}
                    phaseIndex={activeRow.phaseIndex}
                    variant="compact"
                  />
                  <p className="mt-1 max-w-[18rem] text-center text-[11px] text-muted-foreground">
                    {activeRow.positionSubtitle}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground">Why it’s in this phase</p>
                  {activeRow.whyInsightLines.length > 0 ? (
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                      {activeRow.whyInsightLines.map((line, idx) => (
                        <li key={`${idx}-${line}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">{GENERIC_WHY[activeRow.category]}</p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground">Next best steps</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    {nextBestSteps.map((step, idx) => (
                      <li key={`${idx}-${step.slice(0, 24)}`}>{step}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
