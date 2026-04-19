import Link from "next/link";
import { BookMarked, BookOpen, Download, List, PlayCircle, PlusCircle, Settings } from "lucide-react";
import { getScriptureHomeOverview, getScriptureLibraryRows } from "@/app/actions/scripture-module";
import { VerseStatusBadges } from "@/components/scripture-module/verse-status-badges";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  filterLibraryRows,
  parseLibraryFilter,
  scriptureLibraryHref,
  type LibraryFilterPreset,
} from "@/lib/scripture-module/library-filter";
import { cn } from "@/lib/utils";

type PageProps = { searchParams: Promise<{ filter?: string; list?: string; q?: string }> };

const FILTER_OPTIONS: { id: LibraryFilterPreset; label: string }[] = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "grip_completed", label: "Memorization complete" },
  { id: "due_review", label: "Due for review" },
];

export default async function ScriptureHomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter = parseLibraryFilter(sp.filter);
  const listId = sp.list?.trim() || null;
  const q = sp.q ?? "";

  const [overview, lib] = await Promise.all([getScriptureHomeOverview(), getScriptureLibraryRows()]);

  if ("error" in overview) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {overview.error}
      </div>
    );
  }
  if ("error" in lib) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {lib.error}
      </div>
    );
  }

  const listNameById = new Map(lib.lists.map((l) => [l.id, l.name]));
  const filtered = filterLibraryRows(lib.rows, filter, listId, q, listNameById);

  const {
    totalVerses,
    totalLists,
    gripNotStarted,
    gripInProgress,
    gripCompleted,
    holdReviewsDue,
    holdEstablished,
  } = overview;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Scripture Memory
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">Library</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Saved verses, structured memorization, and scheduled retention reviews. Use filters below to focus your library.
        </p>
      </div>

      <section className="grid gap-3 rounded-xl border border-border bg-muted/20 p-5 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Saved verses
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{totalVerses}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Lists
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{totalLists}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Reviews due
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{holdReviewsDue}</p>
          <p className="text-xs text-muted-foreground">Retention due now or overdue</p>
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-dashed border-border bg-muted/15 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Not memorized yet
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{gripNotStarted}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Memorization in progress
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{gripInProgress}</p>
          <p className="text-xs text-muted-foreground">Understand through full recall</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Memorization complete
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{gripCompleted}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Established rhythm
          </p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{holdEstablished}</p>
          <p className="text-xs text-muted-foreground">Stable in scheduled review</p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/scripture/memorize"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <PlayCircle className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">Memorize</span>
          <span className="text-xs text-muted-foreground">Work through your My Verses queue in order.</span>
        </Link>
        <Link
          href="/scripture/my-verses"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <BookMarked className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">My Verses</span>
          <span className="text-xs text-muted-foreground">Your personal memorization bank from lists.</span>
        </Link>
        <Link
          href="/scripture/review"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <BookOpen className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">Review queue</span>
          <span className="text-xs text-muted-foreground">
            {holdReviewsDue > 0 ? `${holdReviewsDue} due now` : "Nothing due right now"}
          </span>
        </Link>
        <Link
          href="/scripture/new"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <PlusCircle className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">Add a verse</span>
          <span className="text-xs text-muted-foreground">Create a new saved passage.</span>
        </Link>
        <Link
          href="/scripture/lists"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <List className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">Lists</span>
          <span className="text-xs text-muted-foreground">Organize verses into named lists.</span>
        </Link>
        <Link
          href="/scripture/settings"
          className={cn(
            "rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40",
            "flex flex-col gap-2"
          )}
        >
          <Download className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-sm font-medium text-foreground">Import verses</span>
          <span className="text-xs text-muted-foreground">Bulk import lives in Settings.</span>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-3">
          <h2 className="text-sm font-medium text-foreground">All verses</h2>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.id;
              const href = scriptureLibraryHref({
                filter: opt.id,
                list: listId,
                q: q || null,
              });
              return (
                <Link
                  key={opt.id}
                  href={href}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <form method="get" action="/scripture" className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="filter" value={filter} />
            <div className="flex-1 space-y-1">
              <label htmlFor="lib-q" className="text-xs text-muted-foreground">
                Search reference, text, or list name
              </label>
              <input
                id="lib-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="e.g. Psalm, peace, Morning…"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>
            <div className="space-y-1 sm:w-56">
              <label htmlFor="lib-list" className="text-xs text-muted-foreground">
                List
              </label>
              <select
                id="lib-list"
                name="list"
                defaultValue={listId ?? ""}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <option value="">All lists</option>
                {lib.lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "sm:mb-0.5")}>
              Apply
            </button>
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No verses match these filters.{" "}
            <Link href="/scripture" className="text-foreground underline underline-offset-4">
              Clear filters
            </Link>
            {" · "}
            <Link href="/scripture/new" className="text-foreground underline underline-offset-4">
              Add a verse
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {filtered.map((row) => (
              <li key={row.item.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <Link
                      href={`/scripture/items/${row.item.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.item.reference}
                    </Link>
                    <VerseStatusBadges
                      grip={row.grip}
                      holdStatus={row.holdStatus}
                      holdNextReviewAt={row.holdNextReviewAt}
                      reviewDue={row.reviewDue}
                      reviewIntervalOverrideDays={row.reviewIntervalOverrideDays}
                    />
                    {row.item.translation ? (
                      <p className="text-xs text-muted-foreground">{row.item.translation}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/scripture/items/${row.item.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center">
        <Link
          href="/scripture/settings"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-2")}
        >
          <Settings className="size-4" aria-hidden />
          Settings & import
        </Link>
      </p>
    </div>
  );
}
