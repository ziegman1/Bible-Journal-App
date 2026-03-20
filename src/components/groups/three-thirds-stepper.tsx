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
      className="flex items-center justify-between gap-2 mb-8"
      aria-label="Meeting sections"
    >
      {sections.map((s, i) => (
        <button
          key={s.num}
          type="button"
          onClick={() => onSectionChange(s.num)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-colors",
            activeSection === s.num
              ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
              : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400"
          )}
        >
          <span className="text-lg font-medium">{s.num}</span>
          <span className="text-xs font-medium hidden sm:inline">
            {s.label}
          </span>
          <span className="text-xs font-medium sm:hidden">{s.short}</span>
        </button>
      ))}
    </nav>
  );
}
