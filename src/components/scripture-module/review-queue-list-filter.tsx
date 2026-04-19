"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewQueueListFilter({
  lists,
  currentListId,
}: {
  lists: { id: string; name: string }[];
  currentListId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onListChange(listId: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (listId) p.set("list", listId);
    else p.delete("list");
    const s = p.toString();
    startTransition(() => {
      router.push(`/scripture/review${s ? `?${s}` : ""}`);
    });
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
      <div className="space-y-1">
        <Label htmlFor="review-list-filter" className="text-xs text-muted-foreground">
          Filter by list
        </Label>
        <select
          id="review-list-filter"
          className={cn(
            "h-9 max-w-xs rounded-md border border-input bg-background px-3 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pending && "opacity-60"
          )}
          value={currentListId ?? ""}
          disabled={pending}
          onChange={(e) => onListChange(e.target.value)}
        >
          <option value="">All verses in HOLD</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
