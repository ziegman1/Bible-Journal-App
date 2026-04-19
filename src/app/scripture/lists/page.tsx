import Link from "next/link";
import { getScriptureListsOverview } from "@/app/actions/scripture-module";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function ScriptureListsPage() {
  const data = await getScriptureListsOverview();
  if ("error" in data) {
    return <p className="text-sm text-destructive">{data.error}</p>;
  }

  const { lists } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Lists
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">Your lists</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Group verses by theme, book, or season. A verse can belong to multiple lists.
          </p>
        </div>
        <Link
          href="/scripture/lists/new"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          New list
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No lists yet.</p>
          <Link
            href="/scripture/lists/new"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-4 inline-flex")}
          >
            Create a list
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {lists.map((l) => (
            <li key={l.id}>
              <Link
                href={`/scripture/lists/${l.id}`}
                className="flex flex-col gap-1 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-foreground">{l.name}</span>
                <span className="text-sm text-muted-foreground">
                  {l.verseCount} verse{l.verseCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
