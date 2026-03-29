"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setThirdsParticipationStartedOn } from "@/app/actions/thirds-personal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ThirdsParticipationStartForm({
  initialYmd,
  hasSettings,
}: {
  initialYmd: string | null;
  hasSettings: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ymd, setYmd] = useState(initialYmd ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await setThirdsParticipationStartedOn(ymd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessage(
        `Tracking from week of ${res.normalizedStartMonday} (UTC Monday of the date you chose).`
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="thirds-start">Participation start date</Label>
        <p className="text-xs text-muted-foreground">
          We normalize to the UTC Monday that begins that week. Your ratio counts finalized solo weeks
          from that Monday through the current week.
        </p>
        <Input
          id="thirds-start"
          type="date"
          required
          value={ymd}
          onChange={(e) => setYmd(e.target.value)}
          disabled={pending}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !ymd}>
        {hasSettings ? "Update start date" : "Save start date"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
    </form>
  );
}
