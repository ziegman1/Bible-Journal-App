"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateScriptureItem } from "@/app/actions/scripture-module";
import { DeleteScriptureItemButton } from "@/components/scripture-module/delete-scripture-item-button";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ScriptureItemDTO } from "@/lib/scripture-module/types";
import { cn } from "@/lib/utils";

export function EditVerseForm({
  item,
  listIds: initialListIds,
  lists,
}: {
  item: ScriptureItemDTO;
  listIds: string[];
  lists: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateScriptureItem(item.id, fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/scripture/items/${item.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <input
          id="reference"
          name="reference"
          required
          defaultValue={item.reference}
          autoComplete="off"
          className={cn(
            "flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="translation">Translation</Label>
        <input
          id="translation"
          name="translation"
          defaultValue={item.translation ?? ""}
          autoComplete="off"
          className={cn(
            "flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="verseText">Verse text</Label>
        <Textarea
          id="verseText"
          name="verseText"
          required
          rows={6}
          className="resize-y"
          defaultValue={item.verseText}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          className="resize-y"
          defaultValue={item.notes ?? ""}
        />
      </div>

      <fieldset id="verse-lists" className="space-y-2 scroll-mt-24">
        <legend className="text-sm font-medium text-foreground">Lists</legend>
        {lists.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No lists yet.{" "}
            <Link
              href={`/scripture/lists/new?returnTo=/scripture/items/${item.id}/edit`}
              className="underline underline-offset-4"
            >
              Create a list
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {lists.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`list-${l.id}`}
                  name="listIds"
                  value={l.id}
                  defaultChecked={initialListIds.includes(l.id)}
                  className="size-4 rounded border-input"
                />
                <Label htmlFor={`list-${l.id}`} className="font-normal">
                  {l.name}
                </Label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Link
          href={`/scripture/items/${item.id}`}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancel
        </Link>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Remove this verse from your library (including memorization progress).
        </p>
        <div className="mt-3">
          <DeleteScriptureItemButton itemId={item.id} reference={item.reference} />
        </div>
      </div>
    </form>
  );
}
