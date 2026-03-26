"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyPassageObservationsForMeeting } from "@/app/actions/meetings";
import { formatObservationVerseRefShort } from "@/lib/groups/observation-verse-ref";
import { normalizeMeetingUserId } from "@/lib/groups/member-display-name";
import { cn } from "@/lib/utils";
import type { PassageObservationRow } from "@/hooks/use-meeting-responses-realtime";
import { ChevronDown } from "lucide-react";

const OBSERVATION_GROUPS = [
  { type: "like", heading: "Like" },
  { type: "difficult", heading: "Difficult" },
  { type: "teaches_about_people", heading: "Teaches about people" },
  { type: "teaches_about_god", heading: "Teaches about God" },
] as const;

function rowToPassageObservation(
  row: Awaited<
    ReturnType<typeof getMyPassageObservationsForMeeting>
  >["observations"][number]
): PassageObservationRow {
  const vn = row.verse_number;
  const verseNum =
    vn == null || !Number.isFinite(Number(vn)) ? null : Number(vn);
  const ve = row.verse_end;
  return {
    id: row.id,
    meeting_id: row.meeting_id,
    user_id: row.user_id,
    observation_type: row.observation_type,
    book: row.book,
    chapter: row.chapter,
    verse_number: verseNum,
    verse_end:
      verseNum == null
        ? null
        : ve != null && Number.isFinite(Number(ve))
          ? Number(ve)
          : null,
    note: row.note,
  };
}

function formatBullet(o: PassageObservationRow): string | null {
  const text = (o.note ?? "").trim();
  const refShort = formatObservationVerseRefShort(
    o.verse_number,
    o.verse_end != null && o.verse_end !== o.verse_number ? o.verse_end : null
  );
  if (!text && !refShort) return null;
  if (!text) return refShort ?? null;
  if (!refShort) return text;
  return `${refShort} — ${text}`;
}

export type ObservationsHelperProps = {
  meetingId: string;
  userId: string;
  /**
   * Shown as: Observations from {referenceLabel}
   * @default "this passage"
   */
  referenceLabel?: string | null;
  /**
   * When set (e.g. live meeting), uses these rows and skips fetch. Filtered to `userId`.
   */
  observations?: PassageObservationRow[];
};

export function ObservationsHelper({
  meetingId,
  userId,
  referenceLabel,
  observations: observationsFromParent,
}: ObservationsHelperProps) {
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState<PassageObservationRow[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const useParent = observationsFromParent !== undefined;

  useEffect(() => {
    if (useParent) return;
    let cancelled = false;
    setFetched(null);
    setFetchError(null);
    void (async () => {
      const r = await getMyPassageObservationsForMeeting(meetingId);
      if (cancelled) return;
      if (r.error) {
        setFetchError(r.error);
        setFetched([]);
        return;
      }
      setFetched(r.observations.map(rowToPassageObservation));
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingId, useParent]);

  const viewerNorm = normalizeMeetingUserId(userId) ?? userId;

  const mine = useMemo(() => {
    if (useParent) {
      return observationsFromParent.filter((o) => {
        const ou = normalizeMeetingUserId(o.user_id) ?? o.user_id;
        return ou === viewerNorm;
      });
    }
    return fetched ?? [];
  }, [useParent, observationsFromParent, fetched, viewerNorm]);

  const grouped = useMemo(() => {
    const map = new Map<string, PassageObservationRow>();
    for (const o of mine) {
      map.set(o.observation_type, o);
    }
    return OBSERVATION_GROUPS.map((g) => ({
      ...g,
      row: map.get(g.type),
      bullet: map.get(g.type)
        ? formatBullet(map.get(g.type)!)
        : null,
    })).filter((g) => g.bullet);
  }, [mine]);

  const hasAny = grouped.length > 0;
  const label = (referenceLabel ?? "").trim() || "this passage";
  const loading = !useParent && fetched === null && !fetchError;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-[#e5e1dc] bg-[#f8f7f5]/90 px-3 py-2.5 text-left text-sm font-medium text-[#1c252e] shadow-sm",
          "transition-colors hover:bg-[#f0eeeb]/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83b0da]/50"
        )}
        aria-expanded={open}
      >
        <span>View My Observations</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:duration-0",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-2 space-y-3 rounded-lg border border-[#e8e4df]/90 bg-white/80 px-3 py-3 text-sm text-[#1c252e]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6570]">
              Observations from {label}
            </p>

            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : fetchError ? (
              <p className="text-destructive text-sm">{fetchError}</p>
            ) : !hasAny ? (
              <p className="text-muted-foreground leading-relaxed">
                No observations recorded yet. Return to Look Up to reflect on
                the passage.
              </p>
            ) : (
              <div className="space-y-3">
                {grouped.map((g) => (
                  <div key={g.type}>
                    <p className="text-xs font-medium text-[#5c6570]">
                      {g.heading}
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#1c252e]/90">
                      <li className="text-sm leading-snug">{g.bullet}</li>
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {!loading && !fetchError ? (
              <p
                className={cn(
                  "text-xs italic leading-relaxed text-muted-foreground",
                  hasAny && "border-t border-[#e8e4df] pt-3"
                )}
              >
                Take a moment to pray and ask how God is calling you to
                respond.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
