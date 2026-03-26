"use client";

import Link from "next/link";
import { useJournalFilter } from "@/components/journal-filter-context";

interface JournalEntryWithAI {
  id: string;
  entry_date: string;
  year: number;
  reference: string;
  title?: string | null;
  user_question: string | null;
  scripture_text: string | null;
  user_reflection: string | null;
  prayer: string | null;
  application: string | null;
  soaps_share: string | null;
  created_at: string;
  ai_response_id?: string | null;
  study_thread_id?: string | null;
  ai_response?: { summary?: string } | null;
}

interface JournalTimelineProps {
  entries: JournalEntryWithAI[];
  hasFilters?: boolean;
}

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JournalTimeline({ entries, hasFilters }: JournalTimelineProps) {
  const filterContext = useJournalFilter();
  const isPending = filterContext?.isPending ?? false;

  if (entries.length === 0 && !isPending) {
    return (
      <div className="text-center py-16 px-4 rounded-lg border border-dashed border-border">
        {hasFilters ? (
          <>
            <p className="text-stone-500 dark:text-stone-400 font-serif">
              No entries match your filters.
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
              Try adjusting your search, book, tag, or month.
            </p>
            <Link
              href="/app/journal"
              className="inline-block mt-6 text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              Clear filters →
            </Link>
          </>
        ) : (
          <>
            <p className="text-stone-500 dark:text-stone-400 font-serif">
              No journal entries yet.
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
              Read a passage, ask a question, and save your reflections.
            </p>
            <Link
              href="/app/read"
              className="inline-block mt-6 text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              Start reading →
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>
      {entries.map((entry) => {
        const displayTitle = entry.title || entry.reference;
        const aiSummary = entry.ai_response?.summary;
        return (
          <Link key={entry.id} href={`/app/journal/${entry.id}`}>
            <article className="block rounded-lg border border-border p-5 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <time className="text-xs text-stone-500 dark:text-stone-400">
                  {formatDate(entry.entry_date)}
                </time>
                <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  {entry.reference}
                </span>
              </div>
              <h2 className="text-lg font-serif font-light text-stone-800 dark:text-stone-200 mb-2">
                {displayTitle}
              </h2>
              <div className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
                {entry.user_question && (
                  <p>
                    <span className="text-stone-500 dark:text-stone-500">Q: </span>
                    {truncate(entry.user_question, 120)}
                  </p>
                )}
                {aiSummary && (
                  <p className="italic">
                    {truncate(aiSummary, 150)}
                  </p>
                )}
                {(entry.scripture_text || entry.user_reflection) && (
                  <p>
                    {truncate(entry.scripture_text || entry.user_reflection, 100)}
                  </p>
                )}
                {(() => {
                  const bits: string[] = [];
                  if (entry.prayer) bits.push("Prayer");
                  if (entry.application) bits.push("Application");
                  if (entry.soaps_share) bits.push("Share");
                  return bits.length > 0 ? (
                    <p className="text-xs">{bits.join(" · ")}</p>
                  ) : null;
                })()}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
