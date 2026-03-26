import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function SoapsFieldRow({
  letter,
  label,
  htmlFor,
  children,
}: {
  letter: string;
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_1fr] gap-x-3 sm:grid-cols-[2rem_1fr]">
      <div
        className="flex justify-center pt-2 text-sm font-bold tabular-nums text-primary select-none"
        aria-hidden
      >
        {letter}
      </div>
      <div className="min-w-0 space-y-1.5">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-stone-800 dark:text-stone-200">
            {label}
          </Label>
        ) : (
          <span className="text-sm font-medium leading-none text-stone-800 dark:text-stone-200">
            {label}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
