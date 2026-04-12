"use client";

import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

type Props = {
  needleDegrees: number;
  status: "ahead" | "on_pace" | "behind";
  message: string;
  expectedChapters: number;
  actualChapters: number;
  daysElapsed: number;
  chaptersPerDay: number;
  className?: string;
  variant?: "default" | "compact";
  copyTone?: GrowthCopyTone;
  /** Today's shared forward chapters (CHAT phase 2). */
  dailyShortLine?: string;
  dailyTargetSummary?: string;
  pairMetDaily?: boolean;
};

export function ChatReadingPaceMeter({
  needleDegrees,
  status,
  message,
  expectedChapters,
  actualChapters,
  daysElapsed,
  chaptersPerDay,
  className,
  variant = "default",
  copyTone,
  dailyShortLine,
  dailyTargetSummary,
  pairMetDaily,
}: Props) {
  const dailyBit =
    dailyShortLine && dailyTargetSummary
      ? ` ${dailyShortLine} Today's stretch: ${dailyTargetSummary}${pairMetDaily ? " (complete)." : "."}`
      : dailyShortLine
        ? ` ${dailyShortLine}`
        : "";
  const ariaDescription = `${message} Expected ${expectedChapters} chapters over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"} at ${chaptersPerDay} per day; you have completed ${actualChapters} from the shared plan start.${dailyBit}`;
  const compact = variant === "compact";

  return (
    <div className={cn("space-y-2", className)}>
      <PaceNeedleMeter
        needleDegrees={needleDegrees}
        status={status}
        message={message}
        variant={variant}
        ariaDescription={ariaDescription}
        copyTone={copyTone}
        detailLine={
          compact
            ? undefined
            : `Plan: ${expectedChapters} chapter${expectedChapters === 1 ? "" : "s"} expected · ${actualChapters} completed by you (${daysElapsed} day${daysElapsed === 1 ? "" : "s"} × ${chaptersPerDay}/day)`
        }
        detailLineCompact={
          compact
            ? `${expectedChapters} expected · ${actualChapters} done · ${chaptersPerDay}/day`
            : undefined
        }
      />
      {dailyShortLine ? (
        <div
          className={cn(
            "rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-center text-xs leading-snug text-muted-foreground",
            compact && "px-2 py-1.5 text-[11px]"
          )}
        >
          <p className="font-medium text-foreground">{dailyShortLine}</p>
          {dailyTargetSummary ? (
            <p className="mt-1 text-muted-foreground">
              {pairMetDaily ? "Today's stretch: " : "Next together: "}
              {dailyTargetSummary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
