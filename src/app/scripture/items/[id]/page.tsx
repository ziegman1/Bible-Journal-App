import Link from "next/link";
import { notFound } from "next/navigation";
import { getScriptureItemDetail } from "@/app/actions/scripture-module";
import { DeleteScriptureItemButton } from "@/components/scripture-module/delete-scripture-item-button";
import { ReviewIntervalOverrideForm } from "@/components/scripture-module/review-interval-override-form";
import { VerseStatusBadges } from "@/components/scripture-module/verse-status-badges";
import { memorizationStageShortLabel, reviewStageLabelLine } from "@/lib/scripture-module/stage-labels";
import type { MemorizeStage } from "@/lib/scripture-module/types";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

function memorizationLabel(memory: {
  gripStatus: string;
  memorizeStage: MemorizeStage;
} | null): { line: string; step?: string } {
  if (!memory) return { line: "Not started" };
  if (memory.gripStatus === "completed" || memory.memorizeStage === "completed") {
    return { line: "Memorization complete" };
  }
  if (memory.memorizeStage === "context") {
    return { line: "In progress", step: "Context" };
  }
  return { line: "In progress", step: memorizationStageShortLabel(memory.memorizeStage) };
}

function holdStatusLabel(status: string | null | undefined): string {
  if (status === "fresh") return "Fresh";
  if (status === "strengthening") return "Strengthening";
  if (status === "established") return "Established";
  return "—";
}

export default async function ScriptureItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getScriptureItemDetail(id);
  if ("error" in data) {
    notFound();
  }

  const { item, lists, memory } = data;
  const status = memorizationLabel(memory);
  const completed = memory?.gripStatus === "completed" || memory?.memorizeStage === "completed";
  const memorizeHref = `/scripture/items/${item.id}/memorize`;
  const meditateHref = `/scripture/items/${item.id}/meditate`;
  const reviewHref = `/scripture/items/${item.id}/review`;

  const holdSeeded = completed && memory?.holdStatus != null && memory.holdNextReviewAt != null;
  /** Server render snapshot: compare ISO instants lexicographically. */
  const nowIso = new Date().toISOString();
  const reviewDue =
    holdSeeded && memory?.holdNextReviewAt != null && memory.holdNextReviewAt <= nowIso;

  const memorizeCtaLabel = !memory
    ? "Begin memorizing"
    : completed
      ? "Revisit memorization"
      : "Resume memorizing";

  const reviewStage = memory?.reviewStage ?? null;
  const midTypedReview =
    completed && reviewStage != null && reviewStage !== "stage_4";
  const reviewCtaLabel = midTypedReview
    ? "Resume review"
    : reviewDue
      ? "Review now"
      : "Review early";

  const gripForBadge =
    !memory ? "not_started" : completed ? "completed" : "in_progress";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Verse
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">{item.reference}</h1>
          <VerseStatusBadges
            grip={gripForBadge}
            holdStatus={memory?.holdStatus ?? null}
            holdNextReviewAt={memory?.holdNextReviewAt ?? null}
            reviewDue={reviewDue}
            reviewIntervalOverrideDays={memory?.reviewIntervalOverrideDays ?? null}
          />
          {item.translation ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.translation}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={meditateHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Meditation
          </Link>
          {!completed ? (
            <Link
              href={memorizeHref}
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              {memorizeCtaLabel}
            </Link>
          ) : (
            <>
              <Link
                href={reviewHref}
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                {reviewCtaLabel}
              </Link>
              <Link
                href={memorizeHref}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Revisit memorization
              </Link>
            </>
          )}
          <Link
            href={`/scripture/items/${item.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit verse
          </Link>
          <DeleteScriptureItemButton itemId={item.id} reference={item.reference} />
        </div>
      </div>

      <blockquote className="rounded-xl border border-border bg-card p-5 text-base leading-relaxed text-foreground shadow-sm">
        {item.verseText}
      </blockquote>

      {item.notes ? (
        <section>
          <h2 className="text-sm font-medium text-foreground">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">Lists</h2>
          <Link
            href={`/scripture/items/${item.id}/edit#verse-lists`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Manage lists
          </Link>
        </div>
        {lists.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not in any list yet. Use Manage lists to assign this verse to your collections.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {lists.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/scripture/lists/${l.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "inline-flex"
                  )}
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Initial memorization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="text-foreground">{status.line}</span>
          {status.step ? (
            <>
              {" "}
              · Current step: <span className="text-foreground">{status.step}</span>
            </>
          ) : null}
        </p>
        {memory?.completedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Finished {new Date(memory.completedAt).toLocaleString()}
          </p>
        ) : null}
        <Link
          href={memorizeHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 inline-flex")}
        >
          {memorizeCtaLabel}
        </Link>
      </section>

      {completed && memory ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-medium text-foreground">Retention &amp; review</h2>
          {holdSeeded ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Rhythm:{" "}
                <span className="text-foreground">{holdStatusLabel(memory.holdStatus)}</span>
                {memory.reviewStage ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-foreground">{reviewStageLabelLine(memory.reviewStage)}</span>
                  </>
                ) : null}
              </p>
              {memory.holdNextReviewAt ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Next review:{" "}
                  <span className="text-foreground">
                    {new Date(memory.holdNextReviewAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {reviewDue ? (
                    <span className="ml-2 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-200">
                      Due
                    </span>
                  ) : null}
                </p>
              ) : null}
              {memory.holdLastReviewedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last review session: {new Date(memory.holdLastReviewedAt).toLocaleString()}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  No typed review completed yet—open when you&apos;re ready.
                </p>
              )}
              <div className="mt-4 border-t border-border pt-4">
                <ReviewIntervalOverrideForm itemId={item.id} memory={memory} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={reviewHref} className={cn(buttonVariants({ size: "sm" }))}>
                  {reviewCtaLabel}
                </Link>
                {!reviewDue ? (
                  <p className="w-full text-xs text-muted-foreground">
                    Not due yet—you can still run a typed review anytime; it becomes your next
                    scheduled review.
                  </p>
                ) : null}
                <Link
                  href="/scripture/review"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Review queue
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Preparing your review schedule… Refresh in a moment if this lingers.
            </p>
          )}
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Added {new Date(item.createdAt).toLocaleString()}
        {item.updatedAt !== item.createdAt
          ? ` · Updated ${new Date(item.updatedAt).toLocaleString()}`
          : null}
      </p>

      <p className="flex flex-wrap gap-2">
        <Link href="/scripture" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Library
        </Link>
        <Link href="/scripture/review" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Review queue
        </Link>
      </p>
    </div>
  );
}
