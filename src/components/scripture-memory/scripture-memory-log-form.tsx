"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertScriptureMemoryLog } from "@/app/actions/scripture-memory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Dropdown options for logging: always 1–30 (goals only affect meters, not selectable range). */
const LOG_COUNT_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

function clampToLogRange(n: number): number {
  return Math.min(30, Math.max(1, Math.floor(n)));
}

export function ScriptureMemoryLogForm({
  practiceDateYmd,
  initialMemorized,
  initialReviewed,
  monthlyGoal,
  dailyReviewGoal,
}: {
  practiceDateYmd: string;
  initialMemorized: number;
  initialReviewed: number;
  monthlyGoal: number;
  dailyReviewGoal: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [memYes, setMemYes] = useState(initialMemorized > 0);
  const [revYes, setRevYes] = useState(initialReviewed > 0);
  const [memCount, setMemCount] = useState(
    String(initialMemorized > 0 ? clampToLogRange(initialMemorized) : 1)
  );
  const [revCount, setRevCount] = useState(
    String(initialReviewed > 0 ? clampToLogRange(initialReviewed) : 1)
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const memorized = memYes ? parseInt(memCount, 10) : 0;
    const reviewed = revYes ? parseInt(revCount, 10) : 0;
    if (memYes && (!Number.isFinite(memorized) || memorized < 1 || memorized > 30)) {
      toast.error("Choose how many new passages (1–30).");
      return;
    }
    if (revYes && (!Number.isFinite(reviewed) || reviewed < 1 || reviewed > 30)) {
      toast.error("Choose how many reviews (1–30).");
      return;
    }
    startTransition(async () => {
      const res = await upsertScriptureMemoryLog({
        practiceDateYmd,
        memorizedNew: memYes ? memorized : 0,
        reviewed: revYes ? reviewed : 0,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Practice day: <span className="font-medium text-foreground">{practiceDateYmd}</span> (your
        practice timezone)
      </p>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Did you memorize any new passages today?</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="memY"
              checked={!memYes}
              onChange={() => setMemYes(false)}
            />
            No
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="memY" checked={memYes} onChange={() => setMemYes(true)} />
            Yes
          </label>
        </div>
        {memYes ? (
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="mem-n">How many new passages?</Label>
            <Select
              value={memCount}
              onValueChange={(v) => {
                if (v != null) setMemCount(v);
              }}
            >
              <SelectTrigger id="mem-n">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {LOG_COUNT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Monthly goal ({monthlyGoal}/mo) sets the memorization meter; you can still log up to
              30 in a day.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Did you review any passages today?</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="revY"
              checked={!revYes}
              onChange={() => setRevYes(false)}
            />
            No
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="revY" checked={revYes} onChange={() => setRevYes(true)} />
            Yes
          </label>
        </div>
        {revYes ? (
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="rev-n">How many reviews?</Label>
            <Select
              value={revCount}
              onValueChange={(v) => {
                if (v != null) setRevCount(v);
              }}
            >
              <SelectTrigger id="rev-n">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {LOG_COUNT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Daily review goal ({dailyReviewGoal}/day) sets the review meter; you can still log up
              to 30 in a day.
            </p>
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save today"}
      </Button>
    </form>
  );
}
