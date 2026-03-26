"use client";

import { useId } from "react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

const INK = "#3d4f5c";
const OUTLINE_BLUE = "#5b8fc4";
const MUTED = "#8899a8";
const PERFORATION = "#5a6b78";

type CalendarFourMosBadgeProps = {
  className?: string;
};

/**
 * Hand-sketched 4‑month calendar badge: marker filter, thick strokes, curved perforation
 * and week lines; “4 mos” stays outside the filter so Caveat stays sharp.
 */
export function CalendarFourMosBadge({ className }: CalendarFourMosBadgeProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `calendar-four-mos-hand-${uid}`;

  const weekYs = [28, 34, 40, 46, 52];
  const colXs = [11, 15.5, 20, 24.5, 29, 33.5, 38, 42];
  const bodyRowBands = [28, 34, 40, 46, 52, 58] as const;

  return (
    <div
      className={cn("inline-flex flex-col items-stretch justify-end", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 52 78"
        className="h-full w-auto min-h-0 max-h-full"
        overflow="visible"
      >
        <defs>
          <filter
            id={filterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.038 0.068"
              numOctaves={2}
              seed="41"
              result="turb"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turb"
              scale={2.4}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {/* Decorative spiral (marker weight) */}
          <path
            d="M 19 15.5c-2.8-2.5-6 0.2-4.2 3.2s4.5 2.2 2.5 5.8-5.5 2.2-4.5-1.2"
            fill="none"
            stroke={INK}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Binding rings */}
          <ellipse
            cx={14}
            cy={8.5}
            rx={2.2}
            ry={1.35}
            fill="none"
            stroke={INK}
            strokeWidth={2}
          />
          <ellipse
            cx={22}
            cy={8.5}
            rx={2.2}
            ry={1.35}
            fill="none"
            stroke={INK}
            strokeWidth={2}
          />

          {/* Page — stroke drawn first so fill stays clean inside outline */}
          <rect
            x={8}
            y={10}
            width={36}
            height={50}
            rx={3.5}
            ry={3.5}
            className="fill-white dark:fill-zinc-950"
            stroke={OUTLINE_BLUE}
            strokeWidth={2.65}
            strokeLinejoin="round"
            paintOrder="stroke fill"
          />

          {/* Perforation: gentle curve + irregular dash */}
          <path
            d="M 6.2 14 Q 5.4 37 6.2 58"
            fill="none"
            stroke={PERFORATION}
            strokeWidth={1.35}
            strokeDasharray="2.4 3.8 1.6 3.2"
            strokeLinecap="round"
          />

          {/* Week header rule — slight curve */}
          <path
            d="M 11 23.5 Q 26.5 22.9 43 23.5"
            fill="none"
            stroke={MUTED}
            strokeWidth={1.05}
            strokeLinecap="round"
          />

          {/* Column guides */}
          {colXs.map((x) => (
            <line
              key={x}
              x1={x}
              y1={24}
              x2={x}
              y2={58}
              stroke={MUTED}
              strokeWidth={1.05}
              strokeLinecap="round"
            />
          ))}

          {/* Week rows — shallow quadratics (not ruler-straight) */}
          {weekYs.map((y) => (
            <path
              key={y}
              d={`M 11 ${y} Q 27 ${y - 0.45} 43 ${y}`}
              fill="none"
              stroke={MUTED}
              strokeWidth={1.05}
              strokeLinecap="round"
            />
          ))}

          {/* Day box hints below week header (lighter interior grid) */}
          {bodyRowBands.slice(0, -1).map((y0, row) => {
            const y1 = bodyRowBands[row + 1];
            return colXs.slice(0, -1).map((x0, col) => {
              const x1 = colXs[col + 1] ?? 43;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x0 + 0.35}
                  y={y0 + 0.35}
                  width={x1 - x0 - 0.7}
                  height={y1 - y0 - 0.7}
                  rx={0.4}
                  fill="none"
                  stroke={MUTED}
                  strokeWidth={0.95}
                  opacity={0.55}
                />
              );
            });
          })}
        </g>

        {/* Outside filter — sharp Caveat */}
        <text
          x={26}
          y={73}
          textAnchor="middle"
          className={cn(caveat.className)}
          fill={INK}
          style={{
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          4 mos
        </text>
      </svg>
    </div>
  );
}
