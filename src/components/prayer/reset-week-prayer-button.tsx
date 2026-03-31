"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetThisWeeksPrayerTime } from "@/app/actions/prayer-wheel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function ResetWeekPrayerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border border-dashed bg-muted/30 p-5">
      <h2 className="text-sm font-medium text-foreground">Reset this week</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Clear all Prayer Wheel segments and extra minutes logged for the current practice week
        (Sunday–Saturday in your device timezone). Your dashboard prayer total will go back to zero
        for this week. This cannot be undone.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => {
          setError(null);
          setDoneMessage(null);
          setOpen(true);
        }}
      >
        Reset this week&apos;s prayer time
      </Button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {doneMessage ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{doneMessage}</p>
      ) : null}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset this week’s prayer time?"
        description="This removes every Prayer Wheel completion and every extra-minute entry for the current practice week (your device timezone). Past weeks are not affected."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          setError(null);
          setDoneMessage(null);
          const res = await resetThisWeeksPrayerTime();
          if ("error" in res) {
            setError(res.error);
            throw new Error(res.error);
          }
          const parts: string[] = [];
          if (res.removedWheelSegments > 0) {
            parts.push(`${res.removedWheelSegments} wheel segment(s)`);
          }
          if (res.removedExtraEntries > 0) {
            parts.push(`${res.removedExtraEntries} extra log(s)`);
          }
          setDoneMessage(
            parts.length > 0 ? `Removed ${parts.join(" and ")}.` : "Nothing was logged this week."
          );
          router.refresh();
        }}
      />
    </div>
  );
}
