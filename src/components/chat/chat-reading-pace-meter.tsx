"use client";

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
}: Props) {
  const statusLabel =
    status === "on_pace" ? "On pace" : status === "ahead" ? "Ahead of pace" : "Behind pace";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 118"
          className="h-32 w-full max-w-[220px] text-muted-foreground"
          role="img"
          aria-label={`${statusLabel}. ${message} Expected ${expectedChapters} chapters over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"} at ${chaptersPerDay} per day; you have completed ${actualChapters}.`}
        >
          <path
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-border"
          />
          <text x="24" y="108" className="fill-muted-foreground text-[10px] font-medium">
            Behind
          </text>
          <text x="86" y="22" className="fill-muted-foreground text-[10px] font-medium">
            On pace
          </text>
          <text x="158" y="108" className="fill-muted-foreground text-[10px] font-medium">
            Ahead
          </text>
          <g transform="translate(100, 100)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-68"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className={cn(
                "text-foreground",
                status === "ahead" && "text-emerald-600 dark:text-emerald-400",
                status === "behind" && "text-amber-700 dark:text-amber-400"
              )}
              transform={`rotate(${needleDegrees - 90}, 0, 0)`}
            />
            <circle r="5" className="fill-foreground" />
          </g>
        </svg>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {statusLabel}
        </p>
        <p className="text-sm text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          Plan: {expectedChapters} chapter{expectedChapters === 1 ? "" : "s"} expected ·{" "}
          {actualChapters} completed ({daysElapsed} day{daysElapsed === 1 ? "" : "s"} ×{" "}
          {chaptersPerDay}/day)
        </p>
      </div>
    </div>
  );
}
