import { ExternalLink, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ZUME_SOAPS_BIBLE_READING_URL = "https://zume.training/soaps-bible-reading" as const;

/**
 * Link card to the Zúme Training SOAPS Bible Reading lesson (opens in a new tab).
 *
 * @see https://zume.training/soaps-bible-reading
 */
export function SoapsZumeEmbed() {
  return (
    <div className="mt-8 border-t border-border/60 pt-8">
      <a
        href={ZUME_SOAPS_BIBLE_READING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors",
          "hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Zúme: SOAPS Bible reading</h3>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PlayCircle className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          Free video lesson on Zúme Training—walk through SOAPS with audio, transcript, and a full example.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 group-hover:underline dark:text-sky-400">
          Open on Zúme Training
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </span>
      </a>
    </div>
  );
}
