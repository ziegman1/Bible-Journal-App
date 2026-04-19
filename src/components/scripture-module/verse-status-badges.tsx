import { formatManualIntervalLabel } from "@/lib/scripture-module/review-interval-schedule";
import { cn } from "@/lib/utils";

type Grip = "not_started" | "in_progress" | "completed";

function rhythmLabel(status: string | null | undefined): string | null {
  if (status === "fresh") return "Rhythm · Fresh";
  if (status === "strengthening") return "Rhythm · Building";
  if (status === "established") return "Rhythm · Steady";
  return null;
}

export function VerseStatusBadges({
  grip,
  holdStatus,
  holdNextReviewAt,
  reviewDue,
  reviewIntervalOverrideDays,
  className,
}: {
  grip: Grip;
  holdStatus: string | null;
  holdNextReviewAt: string | null;
  reviewDue: boolean;
  /** If set, user chose a fixed gap between completed review cycles. */
  reviewIntervalOverrideDays?: number | null;
  className?: string;
}) {
  const gripLabel =
    grip === "not_started"
      ? "Not started"
      : grip === "in_progress"
        ? "Memorization in progress"
        : "Memorization complete";

  const rhythm = grip === "completed" ? rhythmLabel(holdStatus) : null;
  const due =
    grip === "completed" && holdNextReviewAt
      ? reviewDue
        ? "Review due"
        : "Review scheduled"
      : null;

  const customInterval =
    grip === "completed" && reviewIntervalOverrideDays != null ? (
      <span className="rounded-full bg-sky-950/50 px-2 py-0.5 text-sky-200/90 ring-1 ring-sky-500/25">
        Manual spacing: {formatManualIntervalLabel(reviewIntervalOverrideDays)}
      </span>
    ) : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", className)}>
      <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{gripLabel}</span>
      {rhythm ? (
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-muted-foreground">{rhythm}</span>
      ) : null}
      {customInterval}
      {due ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5",
            reviewDue
              ? "bg-violet-500/15 font-medium text-violet-900 dark:text-violet-100"
              : "bg-muted/60 text-muted-foreground"
          )}
        >
          {due}
        </span>
      ) : null}
    </div>
  );
}
