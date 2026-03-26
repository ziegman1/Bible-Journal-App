"use client";

import { cn } from "@/lib/utils";

interface ThreeThirdsStepperProps {
  activeSection: 1 | 2 | 3;
  onSectionChange: (section: 1 | 2 | 3) => void;
}

const sections = [
  { num: 1, label: "Look Back", short: "Back" },
  { num: 2, label: "Look Up", short: "Up" },
  { num: 3, label: "Look Forward", short: "Forward" },
] as const;

export function ThreeThirdsStepper({
  activeSection,
  onSectionChange,
}: ThreeThirdsStepperProps) {
  return (
    <nav
      className="flex items-center justify-between gap-2"
      aria-label="Meeting sections"
    >
      {sections.map((s) => (
        <button
          key={s.num}
          type="button"
          onClick={() => onSectionChange(s.num)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-lg border bg-card px-2 py-3 text-card-foreground transition-colors",
            activeSection === s.num
              ? "border-foreground/20 bg-muted text-foreground shadow-sm"
              : "border-border text-muted-foreground hover:border-foreground/15 hover:bg-muted/70"
          )}
        >
          <span className="text-lg font-medium tabular-nums">{s.num}</span>
          <span className="hidden text-xs font-medium sm:inline">{s.label}</span>
          <span className="text-xs font-medium sm:hidden">{s.short}</span>
        </button>
      ))}
    </nav>
  );
}
