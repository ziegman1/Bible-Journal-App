"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setScriptureReviewIntervalOverride } from "@/app/actions/scripture-module";
import {
  formatManualIntervalLabel,
  MANUAL_REVIEW_INTERVAL_DAYS,
} from "@/lib/scripture-module/review-interval-schedule";
import type { GripMemoryDTO } from "@/lib/scripture-module/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReviewIntervalOverrideForm({
  itemId,
  memory,
}: {
  itemId: string;
  memory: GripMemoryDTO;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(
    memory.reviewIntervalOverrideDays != null
      ? String(memory.reviewIntervalOverrideDays)
      : "default"
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(memory.reviewIntervalOverrideDays != null ? String(memory.reviewIntervalOverrideDays) : "default");
  }, [memory.id, memory.reviewIntervalOverrideDays]);

  function save(next: string | null) {
    if (next == null) return;
    setError(null);
    setValue(next);
    startTransition(async () => {
      const days = next === "default" ? null : Number(next);
      const res = await setScriptureReviewIntervalOverride(itemId, days);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`review-interval-${itemId}`} className="text-xs text-muted-foreground">
        Next review spacing (after you finish a review cycle)
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={value} onValueChange={save} disabled={pending}>
          <SelectTrigger id={`review-interval-${itemId}`} className="w-full max-w-xs sm:w-[240px]">
            <SelectValue placeholder="Choose spacing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default cadence (builds over time)</SelectItem>
            {MANUAL_REVIEW_INTERVAL_DAYS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {formatManualIntervalLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pending ? (
          <span className="text-xs text-muted-foreground">Saving…</span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {memory.reviewIntervalOverrideDays != null ? (
          <>
            Manual spacing:{" "}
            <span className="text-foreground">{formatManualIntervalLabel(memory.reviewIntervalOverrideDays)}</span>{" "}
            until you change it. The default schedule index still advances for continuity.
          </>
        ) : (
          <>Using the default spacing sequence (1 → 3 → 7 → 14 → 30 days) from your review history.</>
        )}
      </p>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
