"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetThisWeeksPrayerTime } from "@/app/actions/prayer-wheel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { resetWeekPrayerSectionCopy } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";

export function ResetWeekPrayerButton({ copyTone = "accountability" }: { copyTone?: GrowthCopyTone }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const copy = resetWeekPrayerSectionCopy(copyTone);

  return (
    <div className="rounded-xl border border-border border-dashed bg-muted/30 p-5">
      <h2 className="text-sm font-medium text-foreground">{copy.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
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
        {copy.buttonLabel}
      </Button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {doneMessage ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{doneMessage}</p>
      ) : null}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={copy.confirmTitle}
        description={copy.confirmDescription}
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
