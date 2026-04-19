"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPassageToMyVerses } from "@/app/actions/scripture-module";
import { Button } from "@/components/ui/button";

type Props = {
  listId: string;
  itemId: string;
  initialInMyVerses: boolean;
};

export function AddToMyVersesButton({ listId, itemId, initialInMyVerses }: Props) {
  const router = useRouter();
  const [inMyVerses, setInMyVerses] = useState(initialInMyVerses);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setHint(null);
    startTransition(async () => {
      const res = await addPassageToMyVerses(listId, itemId);
      if ("error" in res) {
        setHint(res.error);
        return;
      }
      if (res.alreadyAdded) {
        setHint("Already in My Verses");
        return;
      }
      setInMyVerses(true);
      setHint("Added to My Verses");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending || inMyVerses}
        onClick={onClick}
        className="shrink-0"
      >
        {inMyVerses ? "In My Verses" : "Add to My Verses"}
      </Button>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
