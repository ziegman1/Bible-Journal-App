"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateScriptureMemorySettings,
  type ScriptureMemorySettingsRow,
} from "@/app/actions/scripture-memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScriptureMemoryTotalMemorizedSection({
  settings,
}: {
  settings: ScriptureMemorySettingsRow;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(String(settings.current_total_memorized));

  useEffect(() => {
    setDraft(String(settings.current_total_memorized));
  }, [settings.current_total_memorized, open]);

  function save() {
    const tt = parseInt(draft, 10);
    if (!Number.isFinite(tt) || tt < 0) {
      toast.error("Enter zero or a positive whole number.");
      return;
    }
    startTransition(async () => {
      const res = await updateScriptureMemorySettings({
        monthlyNewPassagesGoal: settings.monthly_new_passages_goal,
        dailyReviewGoal: settings.daily_review_goal,
        currentTotalMemorized: tt,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Total memorized updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <section
        className={cn(
          "rounded-xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 p-5 shadow-sm",
          "dark:border-emerald-500/20 dark:from-card dark:via-emerald-950/15 dark:to-teal-950/10"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80 dark:text-emerald-400/70">
              Running total
            </p>
            <p className="mt-1 text-lg text-foreground sm:text-xl">
              <span className="font-medium">Total Memorized:</span>{" "}
              <span className="font-light tabular-nums text-2xl text-emerald-900 dark:text-emerald-100 sm:text-3xl">
                {settings.current_total_memorized}
              </span>{" "}
              <span className="text-base font-normal text-muted-foreground">
                passage{settings.current_total_memorized === 1 ? "" : "s"}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Adjust if you&apos;re catching up from before you used BADWR—daily logs still update
              this total automatically.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-emerald-300/70 bg-white/80 dark:border-emerald-600/40 dark:bg-emerald-950/30"
            onClick={() => setOpen(true)}
          >
            <Pencil className="mr-1.5 size-3.5" aria-hidden />
            Edit total
          </Button>
        </div>
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[min(90vh,28rem)]">
          <SheetHeader>
            <SheetTitle>Edit total memorized</SheetTitle>
            <SheetDescription>
              Set how many passages you&apos;ve memorized in total (including before this app). Your
              log edits will keep this accurate going forward.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-1 py-2">
            <Label htmlFor="sm-edit-total">Passages memorized (total)</Label>
            <Input
              id="sm-edit-total"
              type="number"
              min={0}
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <SheetFooter className="flex-row justify-end gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
