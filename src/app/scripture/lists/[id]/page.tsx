import Link from "next/link";
import { notFound } from "next/navigation";
import { getScriptureListDetail } from "@/app/actions/scripture-module";
import { AddToMyVersesButton } from "@/components/scripture-module/add-to-my-verses-button";
import { DeleteScriptureListButton } from "@/components/scripture-module/delete-scripture-list-button";
import { RemoveFromListButton } from "@/components/scripture-module/remove-from-list-button";
import { VerseStatusBadges } from "@/components/scripture-module/verse-status-badges";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScriptureListDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureListDetail(id);
  if ("error" in data) {
    notFound();
  }

  const { list, items } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            List
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">{list.name}</h1>
          {list.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{list.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/scripture/lists/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit list
          </Link>
          <DeleteScriptureListButton listId={id} listName={list.name} />
          <Link href="/scripture/new" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            Add verse
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
          No verses in this list yet.{" "}
          <Link href="/scripture/new" className="text-foreground underline underline-offset-4">
            Add a verse
          </Link>{" "}
          and assign it from{" "}
          <Link href="/scripture" className="text-foreground underline underline-offset-4">
            the library
          </Link>{" "}
          or verse editor, or import from Settings.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map(
            ({
              item,
              grip,
              holdStatus,
              holdNextReviewAt,
              reviewIntervalOverrideDays,
              reviewDue,
              inMyVerses,
            }) => (
            <li key={item.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/scripture/items/${item.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.reference}
                  </Link>
                  <VerseStatusBadges
                    grip={grip}
                    holdStatus={holdStatus}
                    holdNextReviewAt={holdNextReviewAt}
                    reviewDue={reviewDue}
                    reviewIntervalOverrideDays={reviewIntervalOverrideDays}
                  />
                  {item.translation ? (
                    <p className="text-xs text-muted-foreground">{item.translation}</p>
                  ) : null}
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.verseText}</p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <AddToMyVersesButton listId={id} itemId={item.id} initialInMyVerses={inMyVerses} />
                  <RemoveFromListButton listId={id} itemId={item.id} />
                </div>
              </div>
            </li>
          )
          )}
        </ul>
      )}

      <p className="flex flex-wrap gap-2">
        <Link href="/scripture/lists" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← All lists
        </Link>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Library
        </Link>
      </p>
    </div>
  );
}
