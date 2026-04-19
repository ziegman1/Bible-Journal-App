import Link from "next/link";
import { Suspense } from "react";
import {
  getAllVersesForReview,
  getHoldReviewQueue,
  getScriptureListsForUser,
} from "@/app/actions/scripture-module";
import { ReviewQueueListFilter } from "@/components/scripture-module/review-queue-list-filter";
import { VerseStatusBadges } from "@/components/scripture-module/verse-status-badges";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatManualIntervalLabel } from "@/lib/scripture-module/review-interval-schedule";
import { reviewStageLabelLine } from "@/lib/scripture-module/stage-labels";
import { cn } from "@/lib/utils";

function holdBadgeLabel(status: string | null): string {
  if (status === "fresh") return "Fresh";
  if (status === "strengthening") return "Strengthening";
  if (status === "established") return "Established";
  return "Rhythm";
}

type PageProps = { searchParams: Promise<{ list?: string }> };

export default async function ScriptureReviewPage({ searchParams }: PageProps) {
  const listId = (await searchParams).list?.trim() || null;

  const [queue, all, listsRes] = await Promise.all([
    getHoldReviewQueue(listId || undefined),
    getAllVersesForReview(),
    getScriptureListsForUser(),
  ]);

  if ("error" in queue) {
    return <p className="text-sm text-destructive">{queue.error}</p>;
  }
  if ("error" in all) {
    return <p className="text-sm text-destructive">{all.error}</p>;
  }
  if ("error" in listsRes) {
    return <p className="text-sm text-destructive">{listsRes.error}</p>;
  }

  const { due, soon, laterCount, nextReviewAt } = queue;
  const { rows } = all;
  const notStarted = rows.filter((r) => r.grip === "not_started");
  const inProgress = rows.filter((r) => r.grip === "in_progress");
  const gripDone = rows.filter((r) => r.grip === "completed");

  const listName = listId ? listsRes.lists.find((l) => l.id === listId)?.name : null;
  const nowIso = new Date().toISOString();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Review
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">Review queue</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Memorized verses come back on a steady rhythm. Open a verse for a short typed review
          (first letters, staged difficulty) when it&apos;s due—or a little early if you like.
        </p>
        {listName ? (
          <p className="mt-2 text-sm text-foreground">
            Filter: <span className="font-medium">{listName}</span> only
          </p>
        ) : null}
      </div>

      {listsRes.lists.length > 0 ? (
        <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted/40" aria-hidden />}>
          <ReviewQueueListFilter lists={listsRes.lists} currentListId={listId} />
        </Suspense>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Due now</p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{due.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Coming up (7 days)</p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{soon.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Scheduled later</p>
          <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{laterCount}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Due now</h2>
        {due.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            <p>Nothing due right now{listName ? ` in “${listName}”` : ""}.</p>
            {nextReviewAt ? (
              <p className="mt-2">
                Next review:{" "}
                <span className="text-foreground">
                  {new Date(nextReviewAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            ) : (
              <p className="mt-2">
                Finish memorizing a verse to start retention reviews, or add verses from the library.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {due.map(({ item, memory, listNames }) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/scripture/items/${item.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.reference}
                  </Link>
                  {item.translation ? (
                    <p className="text-xs text-muted-foreground">{item.translation}</p>
                  ) : null}
                  {listNames.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">{listNames.join(" · ")}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="text-foreground">{reviewStageLabelLine(memory.reviewStage)}</span>
                    <span className="mx-1.5">·</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                      {holdBadgeLabel(memory.holdStatus)}
                    </span>
                    {memory.holdNextReviewAt ? (
                      <>
                        <span className="mx-1.5">·</span>
                        <span>
                          Due{" "}
                          {new Date(memory.holdNextReviewAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memory.reviewIntervalOverrideDays != null ? (
                      <>
                        Spacing:{" "}
                        <span className="text-foreground">
                          {formatManualIntervalLabel(memory.reviewIntervalOverrideDays)} (manual)
                        </span>
                      </>
                    ) : (
                      <>Spacing: default cadence (from your review history)</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/scripture/items/${item.id}/review`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Review
                  </Link>
                  <Link
                    href={`/scripture/items/${item.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Verse
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {soon.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Coming up soon</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {soon.map(({ item, memory, listNames }) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/scripture/items/${item.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.reference}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground">{reviewStageLabelLine(memory.reviewStage)}</span>
                    {" · "}
                    {holdBadgeLabel(memory.holdStatus)}
                    {memory.holdNextReviewAt
                      ? ` · ${new Date(memory.holdNextReviewAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}`
                      : null}
                    {listNames.length > 0 ? ` · ${listNames.join(", ")}` : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memory.reviewIntervalOverrideDays != null ? (
                      <>
                        Spacing:{" "}
                        <span className="text-foreground">
                          {formatManualIntervalLabel(memory.reviewIntervalOverrideDays)} (manual)
                        </span>
                      </>
                    ) : (
                      <>Spacing: default cadence</>
                    )}
                  </p>
                </div>
                <Link
                  href={`/scripture/items/${item.id}/review`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "self-start sm:self-center"
                  )}
                >
                  Review early
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Library snapshot</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Not memorized yet</p>
            <p className="mt-1 text-xl font-light tabular-nums text-foreground">
              {notStarted.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Memorization in progress</p>
            <p className="mt-1 text-xl font-light tabular-nums text-foreground">
              {inProgress.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Memorization complete (retention)</p>
            <p className="mt-1 text-xl font-light tabular-nums text-foreground">{gripDone.length}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved verses yet.{" "}
            <Link href="/scripture/new" className="text-foreground underline underline-offset-4">
              Add a verse
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {rows.map((row) => {
              const { item, grip, holdStatus, holdNextReviewAt, reviewIntervalOverrideDays } = row;
              const reviewDue =
                grip === "completed" &&
                holdNextReviewAt != null &&
                holdNextReviewAt <= nowIso;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <Link
                      href={`/scripture/items/${item.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {item.reference}
                    </Link>
                    {item.translation ? (
                      <p className="text-xs text-muted-foreground">{item.translation}</p>
                    ) : null}
                    <VerseStatusBadges
                      grip={grip}
                      holdStatus={holdStatus}
                      holdNextReviewAt={holdNextReviewAt}
                      reviewDue={reviewDue}
                      reviewIntervalOverrideDays={reviewIntervalOverrideDays}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/scripture/items/${item.id}`}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                    >
                      Verse
                    </Link>
                    {grip === "completed" ? (
                      <Link
                        href={`/scripture/items/${item.id}/review`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Review
                      </Link>
                    ) : (
                      <Link
                        href={`/scripture/items/${item.id}/memorize`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        {grip === "in_progress" ? "Resume memorizing" : "Begin memorizing"}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Library
        </Link>
      </p>
    </div>
  );
}
