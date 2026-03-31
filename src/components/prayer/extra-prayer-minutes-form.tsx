"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordExtraPrayerMinutes } from "@/app/actions/prayer-wheel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extraPrayerFormDescription, extraPrayerSaveSuccess } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";

const OPTIONS = Array.from({ length: 36 }, (_, i) => (i + 1) * 5);

export function ExtraPrayerMinutesForm({ copyTone = "accountability" }: { copyTone?: GrowthCopyTone }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [minutes, setMinutes] = useState("15");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const m = parseInt(minutes, 10);
    startTransition(async () => {
      const res = await recordExtraPrayerMinutes(m);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessage(extraPrayerSaveSuccess(copyTone, m));
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSave}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="text-lg font-serif font-light text-foreground">Extra prayer time</h2>
      <p className="mt-1 text-sm text-muted-foreground">{extraPrayerFormDescription(copyTone)}</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="extra-prayer-min">Minutes</Label>
          <Select value={minutes} onValueChange={(v) => v && setMinutes(v)}>
            <SelectTrigger id="extra-prayer-min" className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
    </form>
  );
}
