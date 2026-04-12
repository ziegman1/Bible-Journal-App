"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleDot, Clock, HeartHandshake, PenLine, Users } from "lucide-react";
import { ExtraPrayerMinutesForm } from "@/components/prayer/extra-prayer-minutes-form";
import { FreestylePrayerPanel } from "@/components/prayer/freestyle-prayer-panel";
import { PrayerWheelTimer } from "@/components/prayer/prayer-wheel-timer";
import { PrayerWheelZumeTraining } from "@/components/prayer/prayer-wheel-zume-training";
import { cn } from "@/lib/utils";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";

type ExpandableTool = "wheel" | "freestyle" | "extra";

export function PrayerToolsHub({ copyTone }: { copyTone: GrowthCopyTone }) {
  const [open, setOpen] = useState<ExpandableTool | null>(null);

  function toggle(tool: ExpandableTool) {
    setOpen((cur) => (cur === tool ? null : tool));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => toggle("wheel")}
          className={cn(
            "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open === "wheel" ? "border-primary ring-1 ring-primary" : "border-border"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <CircleDot className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-foreground">Prayer wheel</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                Twelve guided segments with optional chime and voice between steps.
              </span>
            </span>
          </div>
        </button>

        <Link
          href="/app/prayer/oikos"
          className={cn(
            "rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-foreground">Pray for your Oikos</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                Evangelistic prayer for up to five people from your List of 100.
              </span>
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => toggle("freestyle")}
          className={cn(
            "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open === "freestyle" ? "border-primary ring-1 ring-primary" : "border-border"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <PenLine className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-foreground">Freestyle prayer</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                Open-ended time with an optional short note when you finish.
              </span>
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggle("extra")}
          className={cn(
            "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open === "extra" ? "border-primary ring-1 ring-primary" : "border-border"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Clock className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-foreground">Extra prayer time</span>
              <span className="block text-xs leading-snug text-muted-foreground">
                Log additional minutes outside the wheel (e.g. walking prayer).
              </span>
            </span>
          </div>
        </button>
      </div>

      {open === "wheel" ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HeartHandshake className="size-4 text-violet-600 dark:text-violet-400" aria-hidden />
            Prayer wheel
          </div>
          <PrayerWheelZumeTraining />
          <PrayerWheelTimer copyTone={copyTone} />
        </div>
      ) : null}

      {open === "freestyle" ? <FreestylePrayerPanel copyTone={copyTone} /> : null}

      {open === "extra" ? <ExtraPrayerMinutesForm copyTone={copyTone} /> : null}
    </div>
  );
}
