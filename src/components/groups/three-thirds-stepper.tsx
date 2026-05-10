"use client";

import { cn } from "@/lib/utils";
import type { LookBackSubstep } from "@/lib/groups/meeting-presenter-state";

/** Top rhythm: Look Back (1), Look Up (2), Look Forward (3). Share & Care → Vision live inside Look Back. */
export type ThirdsRhythmSection = 1 | 2 | 3;

interface ThirdsRhythmStepperProps {
  activeSection: ThirdsRhythmSection;
  onSectionChange: (section: ThirdsRhythmSection) => void;
}

const STEPS: { num: ThirdsRhythmSection; label: string; short: string }[] = [
  { num: 1, label: "Look Back", short: "Back" },
  { num: 2, label: "Look Up", short: "Up" },
  { num: 3, label: "Look Forward", short: "Fwd" },
];

const LOOK_BACK_SUBSTEP_LABELS: Record<LookBackSubstep, string> = {
  1: "Share & Care",
  2: "Checking In",
  3: "Vision",
};

export function ThirdsRhythmStepper({ activeSection, onSectionChange }: ThirdsRhythmStepperProps) {
  return (
    <nav
      className="flex flex-wrap items-stretch justify-center gap-1.5 sm:gap-2"
      aria-label="Meeting rhythm"
    >
      {STEPS.map((s) => (
        <button
          key={s.num}
          type="button"
          onClick={() => onSectionChange(s.num)}
          className={cn(
            "flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-lg border bg-card px-1.5 py-2.5 text-card-foreground transition-colors sm:min-w-0 sm:px-2 sm:py-3",
            activeSection === s.num
              ? "border-foreground/20 bg-muted text-foreground shadow-sm"
              : "border-border text-muted-foreground hover:border-foreground/15 hover:bg-muted/70"
          )}
        >
          <span className="text-base font-medium tabular-nums sm:text-lg">{s.num}</span>
          <span className="hidden text-[0.65rem] font-medium leading-tight sm:inline sm:text-xs">{s.label}</span>
          <span className="text-[0.65rem] font-medium leading-tight sm:hidden">{s.short}</span>
        </button>
      ))}
    </nav>
  );
}

const SUBSTEP_SEQUENCE: LookBackSubstep[] = [1, 2, 3];

interface LookBackSubstepIndicatorProps {
  activeSubstep: LookBackSubstep;
  onSubstepChange: (sub: LookBackSubstep) => void;
  /** When false, dots still show current step but are not actionable (e.g. participant following TV). */
  allowSubstepNavigation?: boolean;
  className?: string;
}

/**
 * Compact in-flow progress for the three Look Back moments — not a second top-level stepper row.
 */
export function LookBackSubstepIndicator({
  activeSubstep,
  onSubstepChange,
  allowSubstepNavigation = true,
  className,
}: LookBackSubstepIndicatorProps) {
  const canGoBack = allowSubstepNavigation && activeSubstep > 1;
  const canGoForward = allowSubstepNavigation && activeSubstep < 3;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs leading-snug text-muted-foreground">
        <span className="font-medium text-foreground">Look Back</span>
        <span className="text-muted-foreground/80" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span>{LOOK_BACK_SUBSTEP_LABELS[activeSubstep]}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-1.5" role="group" aria-label="Look Back steps">
          {SUBSTEP_SEQUENCE.map((n) => {
            const active = n === activeSubstep;
            return (
              <button
                key={n}
                type="button"
                disabled={!allowSubstepNavigation}
                aria-current={active ? "step" : undefined}
                aria-label={LOOK_BACK_SUBSTEP_LABELS[n]}
                onClick={() => {
                  if (!allowSubstepNavigation) return;
                  onSubstepChange(n);
                }}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  active ? "bg-foreground" : "bg-muted-foreground/35",
                  allowSubstepNavigation && "hover:bg-muted-foreground/55",
                  !allowSubstepNavigation && "cursor-default"
                )}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => canGoBack && onSubstepChange((activeSubstep - 1) as LookBackSubstep)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors",
              canGoBack ? "hover:bg-muted hover:text-foreground" : "opacity-40"
            )}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => canGoForward && onSubstepChange((activeSubstep + 1) as LookBackSubstep)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors",
              canGoForward ? "hover:bg-muted hover:text-foreground" : "opacity-40"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
