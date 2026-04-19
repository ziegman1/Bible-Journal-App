import Link from "next/link";
import { BookMarked } from "lucide-react";
import { getMyVersesQueue } from "@/app/actions/scripture-module";
import { RemoveMyVerseButton } from "@/components/scripture-module/remove-my-verse-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

function statusLabel(status: string): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "mastered":
      return "Mastered";
    default:
      return status;
  }
}

export default async function ScriptureMyVersesPage() {
  const data = await getMyVersesQueue();
  if ("error" in data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {data.error}
      </div>
    );
  }

  const { rows } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Scripture Memory
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">My Verses</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Your personal memorization queue. Add passages from any list, then use{" "}
          <Link href="/scripture/memorize" className="text-foreground underline underline-offset-4">
            Memorize
          </Link>{" "}
          to work through them in order.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-14 text-center">
          <BookMarked className="mx-auto size-10 text-muted-foreground/80" aria-hidden />
          <p className="mt-4 text-sm font-medium text-foreground">No verses in your queue yet</p>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            Open one of your lists and use <span className="text-foreground">Add to My Verses</span> on each
            passage you want to memorize. Imported lists work great for this.
          </p>
          <p className="mt-6">
            <Link href="/scripture/lists" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              Go to lists
            </Link>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">#{row.sortOrder}</span>
                    <Link
                      href={`/scripture/items/${row.scriptureItemId}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.reference}
                    </Link>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        row.status === "mastered"
                          ? "bg-emerald-500/15 text-emerald-200"
                          : row.status === "in_progress"
                            ? "bg-amber-500/15 text-amber-100/95"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  {row.currentStageLabel ? (
                    <p className="text-xs text-muted-foreground">Current: {row.currentStageLabel}</p>
                  ) : null}
                  <p className="line-clamp-2 text-sm text-muted-foreground">{row.passagePreview}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Link
                    href={`/scripture/items/${row.scriptureItemId}/memorize`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open
                  </Link>
                  <RemoveMyVerseButton myVerseId={row.id} reference={row.reference} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex flex-wrap gap-2">
        <Link href="/scripture/memorize" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          Start memorizing
        </Link>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Scripture home
        </Link>
      </p>
    </div>
  );
}
