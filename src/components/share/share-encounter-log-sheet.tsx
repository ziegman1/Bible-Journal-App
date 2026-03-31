"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordShareEncounter } from "@/app/actions/share-encounters";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shareLogSheetDescription, shareSaveSuccessMessage } from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";

function localDateYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ShareEncounterLogSheet({
  weeklyShareGoalEncounters,
  copyTone = "accountability",
}: {
  weeklyShareGoalEncounters: number;
  copyTone?: GrowthCopyTone;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [encounterDateYmd, setEncounterDateYmd] = useState(() => localDateYmd());
  const [location, setLocation] = useState("");
  const [sharedType, setSharedType] = useState("gospel");
  const [received, setReceived] = useState("green_light");
  const [followUp, setFollowUp] = useState("none");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetForNext() {
    setEncounterDateYmd(localDateYmd());
    setLocation("");
    setSharedType("gospel");
    setReceived("green_light");
    setFollowUp("none");
    setError(null);
    setMessage(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setEncounterDateYmd(localDateYmd());
    } else {
      setError(null);
      setMessage(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await recordShareEncounter({
        encounterDateYmd,
        location,
        sharedType,
        received,
        followUp,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessage(shareSaveSuccessMessage(copyTone));
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        Log a share
      </Button>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="flex w-full max-h-dvh flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Log a share</SheetTitle>
            <SheetDescription>
              {shareLogSheetDescription(copyTone, weeklyShareGoalEncounters)}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="share-date">Date</Label>
              <Input
                id="share-date"
                type="date"
                required
                value={encounterDateYmd}
                onChange={(e) => setEncounterDateYmd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-location">Location</Label>
              <Input
                id="share-location"
                placeholder="Where were you?"
                required
                maxLength={500}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Shared</Label>
              <Select value={sharedType} onValueChange={(v) => v && setSharedType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gospel">Gospel</SelectItem>
                  <SelectItem value="testimony">Testimony</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Received</Label>
              <Select value={received} onValueChange={(v) => v && setReceived(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red_light">Red light (no)</SelectItem>
                  <SelectItem value="yellow_light">Yellow light (maybe)</SelectItem>
                  <SelectItem value="green_light">Green light (yes)</SelectItem>
                  <SelectItem value="already_christian">Already a Christian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Follow up</Label>
              <Select value={followUp} onValueChange={(v) => v && setFollowUp(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="discovery_group">Discovery group</SelectItem>
                  <SelectItem value="thirds_group">3/3rds group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
            ) : null}
            <SheetFooter className="mt-auto flex-col gap-2 p-0 sm:flex-row sm:justify-start">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              {message ? (
                <Button type="button" variant="outline" onClick={resetForNext}>
                  Log another
                </Button>
              ) : null}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
