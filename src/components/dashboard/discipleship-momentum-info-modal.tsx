"use client";

/**
 * Modal explaining Discipleship Momentum for users who might mistake it for performance tracking.
 * Intentionally pastoral and non-technical—no formulas, engine names, or internal mechanics—
 * to build trust and clarity without overwhelming detail.
 */

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Info, XIcon } from "lucide-react";
import * as React from "react";

type Props = {
  className?: string;
};

export function DiscipleshipMomentumInfoModal({ className }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 rounded-full text-indigo-600 hover:bg-indigo-100/80 hover:text-indigo-800",
          "dark:text-indigo-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200",
          "focus-visible:ring-2 focus-visible:ring-indigo-400/50",
          className
        )}
        aria-label="About Discipleship Momentum"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Info className="size-4" strokeWidth={2} />
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-50 bg-black/15 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/40",
              "supports-backdrop-filter:backdrop-blur-[2px]"
            )}
          />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 z-50 max-h-[min(88vh,640px)] w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-4 shadow-xl sm:p-5",
              "transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0"
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <Dialog.Title className="pr-6 text-base font-semibold leading-snug text-foreground">
                About Discipleship Momentum
              </Dialog.Title>
              <Dialog.Close
                render={
                  <Button variant="ghost" size="icon-sm" className="shrink-0 -mr-1 -mt-0.5" />
                }
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            <Dialog.Description className="sr-only">
              Pastoral overview of Discipleship Momentum: purpose, what it reflects, and how to use it
              for encouragement rather than pressure.
            </Dialog.Description>

            <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted-foreground">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  What is Discipleship Momentum?
                </h3>
                <p>
                  This is not a scorecard and not a grade before God. It is a simple picture meant to
                  help you notice how your everyday habits of Scripture, prayer, community, and
                  witness are taking shape—formation and growth over time, not a contest.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">What is being measured?</h3>
                <p>
                  The app pays attention to practices you already care about: time in the Word,
                  prayer, life with others in groups, and steps of sharing your faith. The goal is to
                  connect those actions to deeper meaning—faithfulness in ordinary days—not to reduce
                  your walk with Christ to a number.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">How does this work?</h3>
                <p>
                  Recent days count a bit more than weeks ago, so the view stays connected to where
                  you are now. Consistency matters—steady obedience in real life, not a perfect week.
                  Foundation, formation, and reproduction stay in view together so one area of life
                  does not quietly drift while another looks strong. What you see can shift with your
                  season; that is normal.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Why is sharing highlighted in reproduction?
                </h3>
                <p>
                  Jesus calls his people to make disciples, not only to grow personally. Steps of
                  witness and spiritual conversation belong in the picture as part of passing faith
                  on—not because God loves you more when you share, but because reproduction is part of
                  the mission he gave his church.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">How should I use this?</h3>
                <p>
                  Let it prompt prayer and honest conversation with God, not anxiety or comparison.
                  Celebrate grace where you see it; ask for help where you want to grow. Your Father
                  sees obedience in secret and faithfulness no chart can capture—use this as a guide,
                  not a judge.
                </p>
              </section>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
