"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createScriptureItem } from "@/app/actions/scripture-module";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AddVerseForm({
  lists,
}: {
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
      const res = await createScriptureItem(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/scripture/items/${res.id}`);
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
          autoComplete="off"
          className={cn(
            "flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="translation">Translation</Label>
        <input
          id="translation"
          name="translation"
          autoComplete="off"
          className={cn(
            "flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          placeholder="e.g. ESV"
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
          placeholder="Paste or type the passage…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} className="resize-y" />
      </div>

      {lists.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Lists (optional)</legend>
          <ul className="space-y-2">
            {lists.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`list-${l.id}`}
                  name="listIds"
                  value={l.id}
                  className="size-4 rounded border-input"
                />
                <Label htmlFor={`list-${l.id}`} className="font-normal">
                  {l.name}
                </Label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">
          No lists yet.{" "}
          <Link href="/scripture/lists/new?returnTo=/scripture/new" className="underline underline-offset-4">
            Create a list
          </Link>
        </p>
      )}

      {lists.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/scripture/lists/new?returnTo=/scripture/new" className="underline underline-offset-4">
            Create another list
          </Link>
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save verse"}
        </Button>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
