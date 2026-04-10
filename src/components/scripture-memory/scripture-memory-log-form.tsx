"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertScriptureMemoryLog } from "@/app/actions/scripture-memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScriptureMemoryLogForm({
  practiceDateYmd,
  initialMemorized,
  initialReviewed,
}: {
  practiceDateYmd: string;
  initialMemorized: number;
  initialReviewed: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [memYes, setMemYes] = useState(initialMemorized > 0);
  const [revYes, setRevYes] = useState(initialReviewed > 0);
  const [memCount, setMemCount] = useState(String(Math.max(0, initialMemorized)));
  const [revCount, setRevCount] = useState(String(Math.max(0, initialReviewed)));

  function parseCount(s: string): number {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const memorized = memYes ? parseCount(memCount) : 0;
    const reviewed = revYes ? parseCount(revCount) : 0;
    startTransition(async () => {
      const res = await upsertScriptureMemoryLog({
        practiceDateYmd,
        memorizedNew: memorized,
        reviewed,
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
            <Input
              id="mem-n"
              type="number"
              min={0}
              inputMode="numeric"
              value={memCount}
              onChange={(e) => setMemCount(e.target.value)}
            />
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
            <Input
              id="rev-n"
              type="number"
              min={0}
              inputMode="numeric"
              value={revCount}
              onChange={(e) => setRevCount(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save today"}
      </Button>
    </form>
  );
}
