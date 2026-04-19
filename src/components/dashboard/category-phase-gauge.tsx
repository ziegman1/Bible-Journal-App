"use client";

/**
 * Semicircular phase gauge for discipleship momentum — **visual only**.
 * Shows three phase zones with a needle; values come from `scoreToPhaseGauge` (benchmark mapping),
 * not direct engine masses. Intended to communicate growth phase and approximate placement, not formulas.
 */

import type { CategoryId } from "@/lib/metrics/formation-momentum/types";
import { cn } from "@/lib/utils";

const CATEGORY_TITLE: Record<CategoryId, string> = {
  foundation: "Foundation",
  formation: "Formation",
  reproduction: "Reproduction",
};

/** Subtle tints per zone — indigo/violet/slate family, no traffic-light semantics. */
const ZONE_STROKE_CLASS = [
  "stroke-indigo-300/90 dark:stroke-indigo-500/50",
  "stroke-violet-300/85 dark:stroke-violet-500/45",
  "stroke-slate-400/80 dark:stroke-slate-500/50",
] as const;

const NEEDLE_CLASS = [
  "text-indigo-600 dark:text-indigo-400",
  "text-violet-600 dark:text-violet-400",
  "text-slate-600 dark:text-slate-400",
] as const;

export type CategoryPhaseGaugeProps = {
  category: CategoryId;
  phaseLabel: string;
  phaseLabels: readonly [string, string, string];
  needleT: number;
  positionSubtitle: string;
  phaseIndex: 0 | 1 | 2;
  /** Smaller arc for modal */
  variant?: "default" | "compact";
  className?: string;
};

/** Arc matches pace meter geometry: center (100,100), radius 72, semicircle bulging upward. */
const CX = 100;
const CY = 100;
const R = 72;
const NEEDLE_LEN = 62;

function pointOnArc(t: number): { x: number; y: number } {
  const theta = Math.PI * (1 - t);
  return {
    x: CX + R * Math.cos(theta),
    y: CY - R * Math.sin(theta),
  };
}

export function CategoryPhaseGauge({
  category,
  phaseLabel,
  phaseLabels,
  needleT,
  positionSubtitle,
  phaseIndex,
  variant = "default",
  className,
}: CategoryPhaseGaugeProps) {
  const isCompact = variant === "compact";
  const strokeW = isCompact ? 5 : 6;
  const needleW = isCompact ? 2 : 2.5;
  const hubR = isCompact ? 3.5 : 4.5;

  const segments = [0, 1, 2].map((i) => {
    const t0 = i / 3;
    const t1 = (i + 1) / 3;
    const p0 = pointOnArc(t0);
    const p1 = pointOnArc(t1);
    return { d: `M ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y}`, key: i };
  });

  const nt = clamp01(needleT);
  const tip = pointOnArc(nt);
  const nx = tip.x - CX;
  const ny = tip.y - CY;
  const len = Math.hypot(nx, ny) || 1;
  const scale = NEEDLE_LEN / len;
  const endX = CX + nx * scale;
  const endY = CY + ny * scale;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <p className="text-center text-xs font-semibold text-foreground">{CATEGORY_TITLE[category]}</p>
      <svg
        viewBox="0 0 200 118"
        className={cn(
          "w-full text-muted-foreground",
          isCompact ? "h-20 max-w-[180px]" : "h-[7.25rem] max-w-[220px]"
        )}
        role="img"
        aria-hidden
      >
        {segments.map((seg, i) => (
          <path
            key={seg.key}
            d={seg.d}
            fill="none"
            strokeWidth={strokeW}
            strokeLinecap="round"
            className={ZONE_STROKE_CLASS[i]}
          />
        ))}
        <line
          x1={CX}
          y1={CY}
          x2={endX}
          y2={endY}
          stroke="currentColor"
          strokeWidth={needleW}
          strokeLinecap="round"
          className={cn(NEEDLE_CLASS[phaseIndex])}
        />
        <circle
          cx={CX}
          cy={CY}
          r={hubR}
          className="fill-background stroke-[1.25] stroke-border"
        />
        {!isCompact ? (
          <>
            <text x="22" y="112" className="fill-muted-foreground text-[9px] font-medium">
              {phaseLabels[0]}
            </text>
            <text x="82" y="18" className="fill-muted-foreground text-[9px] font-medium">
              {phaseLabels[1]}
            </text>
            <text x="138" y="112" className="fill-muted-foreground text-[9px] font-medium">
              {phaseLabels[2]}
            </text>
          </>
        ) : null}
      </svg>
      <p
        className={cn(
          "text-center font-medium text-foreground",
          isCompact ? "text-xs" : "text-sm"
        )}
      >
        {phaseLabel}
      </p>
      {!isCompact ? (
        <p className="mt-0.5 max-w-[14rem] text-center text-[11px] leading-snug text-muted-foreground">
          {positionSubtitle}
        </p>
      ) : null}
    </div>
  );
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
