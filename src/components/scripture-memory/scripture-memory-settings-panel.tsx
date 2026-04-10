"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateScriptureMemorySettings,
  type ScriptureMemorySettingsRow,
} from "@/app/actions/scripture-memory";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export function ScriptureMemorySettingsPanel({
  initial,
}: {
  initial: ScriptureMemorySettingsRow;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [monthly, setMonthly] = useState(String(initial.monthly_new_passages_goal));
  const [daily, setDaily] = useState(String(initial.daily_review_goal));
  const [total, setTotal] = useState(String(initial.current_total_memorized));

  function save() {
    const mg = parseInt(monthly, 10);
    const dg = parseInt(daily, 10);
    const tt = parseInt(total, 10);
    if (!Number.isFinite(mg) || mg < 1 || mg > 30) {
      toast.error("Monthly goal must be between 1 and 30.");
      return;
    }
    if (!Number.isFinite(dg) || dg < 1 || dg > 30) {
      toast.error("Daily review goal must be between 1 and 30.");
      return;
    }
    if (!Number.isFinite(tt) || tt < 0) {
      toast.error("Total memorized must be zero or greater.");
      return;
    }
    startTransition(async () => {
      const res = await updateScriptureMemorySettings({
        monthlyNewPassagesGoal: mg,
        dailyReviewGoal: dg,
        currentTotalMemorized: tt,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Settings saved");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "inline-flex items-center gap-2"
        )}
      >
        <Settings className="size-4" />
        Settings
      </SheetTrigger>
      <SheetContent className="w-full max-w-md sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Scripture Memory settings</SheetTitle>
          <SheetDescription>
            Goals control dropdown ranges when logging. Total passages memorized can be set here for
            your starting point; new logs adjust it automatically.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5 px-1">
          <div className="space-y-2">
            <Label>New passages per month (goal)</Label>
            <Select
              value={monthly}
              onValueChange={(v) => {
                if (v != null) setMonthly(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Passages reviewed per day (goal)</Label>
            <Select
              value={daily}
              onValueChange={(v) => {
                if (v != null) setDaily(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-total">Current total passages memorized</Label>
            <Input
              id="sm-total"
              type="number"
              min={0}
              inputMode="numeric"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is your running count. Editing past days updates the total so it stays accurate.
            </p>
          </div>
          <Button type="button" onClick={save} disabled={pending} className="w-full sm:w-auto">
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
