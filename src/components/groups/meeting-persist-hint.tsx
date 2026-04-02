import { cn } from "@/lib/utils";
import type { MeetingPersistStatus } from "@/hooks/use-debounced-meeting-persist";
import { Loader2 } from "lucide-react";

/** Inline save feedback for meeting inputs (mobile-friendly, no toast spam). */
export function MeetingPersistHint({
  status,
  className,
}: {
  status: MeetingPersistStatus;
  className?: string;
}) {
  if (status === "idle" || status === "pending") return null;
  if (status === "saving") {
    return (
      <p
        className={cn(
          "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground",
          className
        )}
        aria-live="polite"
      >
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
        Saving…
      </p>
    );
  }
  if (status === "saved") {
    return (
      <p
        className={cn("mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400", className)}
        aria-live="polite"
      >
        Saved
      </p>
    );
  }
  return (
    <p
      className={cn("mt-2 text-xs font-medium text-destructive", className)}
      role="alert"
    >
      Couldn&apos;t save automatically — use Save below or check your connection.
    </p>
  );
}
