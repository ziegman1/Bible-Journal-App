"use client";

import type { WeeklyRhythmStatus } from "@/lib/dashboard/weekly-rhythm-pace";
import {
  paceMeterArcPositionLabels,
  paceMeterRhythmHeadingLine,
  paceMeterSvgAriaLabel,
} from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

export type PaceNeedleMeterProps = {
  needleDegrees: number;
  status: WeeklyRhythmStatus;
  message: string;
  variant?: "default" | "compact";
  /** Shown below message when variant is default */
  detailLine?: string;
  /** Shown below message when variant is compact */
  detailLineCompact?: string;
  /** Screen reader summary */
  ariaDescription: string;
  className?: string;
  /**
   * When set (e.g. BADWR reproduction narrative), shown as the uppercase line and used for aria.
   * Overrides rhythm-based heading from {@link copyTone}.
   */
  statusHeading?: string;
  /** Growth Mode copy tone; omit for full Focused/accountability behavior. */
  copyTone?: GrowthCopyTone;
};

export function PaceNeedleMeter({
  needleDegrees,
  status,
  message,
  variant = "default",
  detailLine,
  detailLineCompact,
  ariaDescription,
  className,
  statusHeading,
  copyTone,
}: PaceNeedleMeterProps) {
  const tone: GrowthCopyTone = copyTone ?? "accountability";
  const arc = paceMeterArcPositionLabels(tone);

  const narrativeHeading =
    statusHeading != null && statusHeading.trim() !== "" ? statusHeading.trim() : null;
  const rhythmHeading = narrativeHeading == null ? paceMeterRhythmHeadingLine(status, tone) : null;
  const showHeadingLine = narrativeHeading != null || rhythmHeading != null;
  const headingText = narrativeHeading ?? rhythmHeading ?? "";

  const ariaLabel = paceMeterSvgAriaLabel(
    tone,
    status,
    message,
    ariaDescription,
    narrativeHeading
  );

  const compact = variant === "compact";

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-3", className)}>
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 118"
          className={cn(
            "w-full text-muted-foreground",
            compact ? "h-24 max-w-[200px]" : "h-32 max-w-[220px]"
          )}
          role="img"
          aria-label={ariaLabel}
        >
          <path
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={compact ? "5" : "6"}
            strokeLinecap="round"
            className="text-border"
          />
          {!compact && arc.show ? (
            <>
              <text x="24" y="108" className="fill-muted-foreground text-[10px] font-medium">
                {arc.left}
              </text>
              <text x="86" y="22" className="fill-muted-foreground text-[10px] font-medium">
                {arc.center}
              </text>
              <text x="158" y="108" className="fill-muted-foreground text-[10px] font-medium">
                {arc.right}
              </text>
            </>
          ) : null}
          <g transform="translate(100, 100)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-68"
              stroke="currentColor"
              strokeWidth={compact ? "2.5" : "3"}
              strokeLinecap="round"
              className={cn(
                "text-foreground",
                status === "ahead" && "text-emerald-600 dark:text-emerald-400",
                status === "behind" && "text-amber-700 dark:text-amber-400"
              )}
              transform={`rotate(${needleDegrees - 90}, 0, 0)`}
            />
            <circle r={compact ? 4 : 5} className="fill-foreground" />
          </g>
        </svg>
      </div>
      <div className={cn("text-center", compact ? "space-y-0.5" : "space-y-1")}>
        {showHeadingLine ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {headingText}
          </p>
        ) : null}
        <p className={cn("text-foreground", compact ? "text-xs leading-snug" : "text-sm")}>
          {message}
        </p>
        {compact && detailLineCompact ? (
          <p className="text-[11px] text-muted-foreground">{detailLineCompact}</p>
        ) : null}
        {!compact && detailLine ? (
          <p className="text-xs text-muted-foreground">{detailLine}</p>
        ) : null}
      </div>
    </div>
  );
}
