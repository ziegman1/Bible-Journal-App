"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** From server: `soapsTrainingDefaultExpanded(appExperienceMode)` */
  defaultExpanded: boolean;
  children: React.ReactNode;
};

/**
 * Collapsible wrapper for SOAPS instructional content. Smooth height transition via CSS grid.
 */
export function SoapsTrainingCollapsible({ defaultExpanded, children }: Props) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/35 sm:px-5 sm:py-4"
      >
        <ChevronDown
          className={cn(
            "mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
            open && "rotate-180"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-foreground">Learn the SOAPS Method</span>
          {!open ? (
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
              New to SOAPS? Click to learn how it works.
            </p>
          ) : null}
        </div>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          "border-t border-border/60"
        )}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-[min(75vh,1400px)] overflow-y-auto px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
