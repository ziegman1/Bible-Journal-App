"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeMyVerseFromQueue } from "@/app/actions/scripture-module";
import { Button } from "@/components/ui/button";

type Props = {
  myVerseId: string;
  reference: string;
};

export function RemoveMyVerseButton({ myVerseId, reference }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRemove() {
    if (
      !window.confirm(
        `Remove “${reference}” from My Verses? Memorization progress for this verse stays in your library; only the queue entry is removed.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await removeMyVerseFromQueue(myVerseId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onRemove} className="text-muted-foreground">
        Remove
      </Button>
      {error ? (
        <p className="max-w-[12rem] text-[11px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
