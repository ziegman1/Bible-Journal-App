"use client";

import { PRAYER_WHEEL_STEPS, prayerWheelWedgeColor } from "@/lib/prayer-wheel/steps";
import { cn } from "@/lib/utils";

const CX = 100;
const CY = 100;
const R = 88;
const N = PRAYER_WHEEL_STEPS.length;

function wedgePath(i: number): string {
  const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / N;
  const x0 = CX + R * Math.cos(a0);
  const y0 = CY + R * Math.sin(a0);
  const x1 = CX + R * Math.cos(a1);
  const y1 = CY + R * Math.sin(a1);
  return `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
}

function labelTransform(i: number): string {
  const mid = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / N;
  const lr = R * 0.62;
  const x = CX + lr * Math.cos(mid);
  const y = CY + lr * Math.sin(mid);
  const deg = (mid * 180) / Math.PI + 90;
  return `translate(${x},${y}) rotate(${deg})`;
}

export function PrayerWheelSvg({
  activeIndex,
  className,
}: {
  activeIndex: number | null;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("w-full max-w-[min(100%,320px)]", className)}
      aria-hidden
    >
      <title>Prayer wheel</title>
      {PRAYER_WHEEL_STEPS.map((step, i) => {
        const isActive = activeIndex === i;
        const isPast = activeIndex != null && i < activeIndex;
        const opacity = activeIndex == null ? 0.92 : isActive ? 1 : isPast ? 0.78 : 0.38;
        return (
          <path
            key={step.index}
            d={wedgePath(i)}
            fill={prayerWheelWedgeColor(i)}
            opacity={opacity}
            stroke="hsl(0 0% 100% / 0.35)"
            strokeWidth={0.75}
            className="transition-opacity duration-300 dark:stroke-black/20"
          />
        );
      })}
      {PRAYER_WHEEL_STEPS.map((step, i) => (
        <text
          key={`t-${step.index}`}
          transform={labelTransform(i)}
          textAnchor="middle"
          className="pointer-events-none fill-white text-[5.5px] font-bold uppercase tracking-tight drop-shadow-sm dark:fill-white/95"
          style={{ fontSize: "5.5px" }}
        >
          {step.label.length > 10 ? step.label.slice(0, 9) + "…" : step.label}
        </text>
      ))}
      <circle
        cx={CX}
        cy={CY}
        r={22}
        className="fill-background/95 stroke-border dark:fill-card dark:stroke-border"
        strokeWidth={1.5}
      />
    </svg>
  );
}
