/**
 * Preset passage types and pure helpers — safe to import from Client Components.
 * Async scripture loading lives in `preset-story-passage.ts` (server / RSC only).
 */

export type PassageSegment = {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
};

/**
 * Verse line for Look Up / presenter views. Includes book/chapter so multi-segment
 * presets can save observations and render unique keys when verse numbers repeat.
 */
export type PassageVerseLine = {
  verse: number;
  text: string;
  book: string;
  chapter: number;
  /** Stable list key (book + chapter + verse). */
  lineId: string;
  /**
   * When set, render a heading row above this verse (start of a catalog segment).
   */
  segmentHeadingBefore?: string;
  /**
   * Left-column label: verse number only when a single chapter is shown; otherwise book+chapter+verse.
   */
  verseDisplayLabel: string;
};

export function makePassageVerseLineId(
  book: string,
  chapter: number,
  verse: number
): string {
  return `${book.trim()}|${chapter}|${verse}`;
}

/** Wrap a single-chapter manual range as verse lines for Look Up. */
export function wrapChapterVersesAsLines(
  book: string,
  chapter: number,
  verses: { verse: number; text: string }[]
): PassageVerseLine[] {
  return verses.map((v) => ({
    verse: v.verse,
    text: v.text,
    book,
    chapter,
    lineId: makePassageVerseLineId(book, chapter, v.verse),
    verseDisplayLabel: String(v.verse),
  }));
}

export type PresetStoryPassageRow = {
  title: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  description?: string | null;
  passage_segments?: unknown;
  story_subtitle?: string | null;
  phase_title?: string | null;
  command_ref?: string | null;
  story_ref?: string | null;
  additional_refs?: string[] | null;
  series_name?: string | null;
};

function isSegment(v: unknown): v is PassageSegment {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.book === "string" &&
    typeof o.chapter === "number" &&
    typeof o.verse_start === "number" &&
    typeof o.verse_end === "number"
  );
}

/** Normalized segments for loading / labels; falls back to primary coordinates. */
export function parsePassageSegments(row: PresetStoryPassageRow): PassageSegment[] {
  const raw = row.passage_segments;
  if (Array.isArray(raw)) {
    const parsed = raw.filter(isSegment);
    if (parsed.length > 0) return parsed;
  }
  return [
    {
      book: row.book,
      chapter: row.chapter,
      verse_start: row.verse_start,
      verse_end: row.verse_end,
    },
  ];
}

export function formatPassageSegmentRef(s: PassageSegment): string {
  const dash = s.verse_start !== s.verse_end ? `–${s.verse_end}` : "";
  return `${s.book} ${s.chapter}:${s.verse_start}${dash}`;
}

/** Compact reference line for headers / live views (all segments). */
export function formatPresetPassageHeader(row: PresetStoryPassageRow): string {
  return parsePassageSegments(row).map(formatPassageSegmentRef).join("; ");
}

export type SummaryPassageBlock = {
  title: string;
  phase?: string | null;
  storySubtitle?: string | null;
  refsLine: string;
  detail?: string | null;
};

export function buildPresetSummaryPassageBlock(
  row: PresetStoryPassageRow
): SummaryPassageBlock {
  const detail = row.description?.trim() || null;
  return {
    title: row.title,
    phase: row.phase_title ?? null,
    storySubtitle: row.story_subtitle ?? null,
    refsLine: formatPresetPassageHeader(row),
    detail,
  };
}

/** How many catalog `passage_segments` blocks produced at least one verse line. */
export function countLoadedSegmentsFromLines(
  lines: PassageVerseLine[]
): number {
  const withHeading = lines.filter((l) => l.segmentHeadingBefore != null)
    .length;
  if (withHeading > 0) return withHeading;
  return lines.length > 0 ? 1 : 0;
}

/** Note under the passage ref: what’s loaded vs optional readings from the catalog. */
export function buildPresetLookUpLoadCaption(
  row: PresetStoryPassageRow,
  opts?: { loadedSegmentCount?: number }
): string | null {
  const segs = parsePassageSegments(row);
  const loadedN = opts?.loadedSegmentCount ?? segs.length;
  const parts: string[] = [];

  if (segs.length > 1) {
    if (loadedN === 0) {
      parts.push(
        `Could not load any of the ${segs.length} catalog passage segments in-app. Use a Bible or the references below.`
      );
    } else {
      const partialNote =
        opts?.loadedSegmentCount != null && loadedN < segs.length
          ? ` Only ${loadedN} of ${segs.length} catalog segments could be loaded in-app.`
          : "";
      parts.push(
        `Showing ${loadedN} passage segment${loadedN === 1 ? "" : "s"} in order below.${partialNote} Select verses within one segment when saving an observation.`
      );
    }
  }

  const extras = (row.additional_refs ?? []).filter(
    (r) => String(r).trim().length > 0
  );
  if (extras.length > 0) {
    parts.push(
      `Optional cross-references (not loaded here): ${extras.join("; ")}`
    );
  }

  if (row.story_ref?.trim()) {
    parts.push(`Story focus in catalog: ${row.story_ref.trim()}`);
  }

  if (row.command_ref?.trim() && segs.length > 0) {
    const primary = formatPassageSegmentRef(segs[0]);
    if (
      row.command_ref.trim().toLowerCase() !== primary.toLowerCase()
    ) {
      parts.push(`Command text: ${row.command_ref.trim()}`);
    }
  }

  if (parts.length === 0) return null;
  return parts.join(" ");
}
