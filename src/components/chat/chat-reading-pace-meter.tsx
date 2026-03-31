"use client";

import { PaceNeedleMeter } from "@/components/dashboard/pace-needle-meter";

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
  /** Passed to {@link PaceNeedleMeter} for softer On pace / Ahead / Behind labels */
  statusHeading?: string;
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
  statusHeading,
}: Props) {
  const ariaDescription = `${message} Expected ${expectedChapters} chapters over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"} at ${chaptersPerDay} per day; you have completed ${actualChapters}.`;
  const compact = variant === "compact";

  return (
    <PaceNeedleMeter
      needleDegrees={needleDegrees}
      status={status}
      message={message}
      variant={variant}
      className={className}
      ariaDescription={ariaDescription}
      statusHeading={statusHeading}
      detailLine={
        compact
          ? undefined
          : `Plan: ${expectedChapters} chapter${expectedChapters === 1 ? "" : "s"} expected · ${actualChapters} completed (${daysElapsed} day${daysElapsed === 1 ? "" : "s"} × ${chaptersPerDay}/day)`
      }
      detailLineCompact={
        compact
          ? `${expectedChapters} expected · ${actualChapters} done · ${chaptersPerDay}/day`
          : undefined
      }
    />
  );
}
