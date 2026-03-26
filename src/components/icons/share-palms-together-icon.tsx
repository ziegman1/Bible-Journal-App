"use client";

import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Two open hands together, palms-up / offering (for “Share” on facilitator cards).
 * Composed from Lucide `Hand` for consistent stroke with Heart / Footprints.
 */
export function SharePalmsTogetherIcon({
  className,
  style,
  strokeWidth = 1.75,
}: {
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-5 shrink-0 items-end justify-center overflow-visible sm:size-6",
        className
      )}
      style={style}
      aria-hidden
    >
      <Hand
        absoluteStrokeWidth
        className="absolute bottom-0 left-0 size-[0.92rem] -rotate-[44deg] sm:size-[1.05rem]"
        strokeWidth={strokeWidth}
        style={{ color: "inherit", transformOrigin: "50% 100%" }}
      />
      <Hand
        absoluteStrokeWidth
        className="absolute bottom-0 right-0 size-[0.92rem] rotate-[44deg] scale-x-[-1] sm:size-[1.05rem]"
        strokeWidth={strokeWidth}
        style={{ color: "inherit", transformOrigin: "50% 100%" }}
      />
    </span>
  );
}
