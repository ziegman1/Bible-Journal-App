/**
 * Preset story rows for meeting / thirds-personal pickers.
 * Dedupes duplicate DB rows without collapsing legitimately different studies.
 */

import {
  formatPresetPassageHeader,
  type PresetStoryPassageRow,
} from "@/lib/groups/preset-story-passage.shared";

export type PresetStoryPickerRow = {
  id: string;
  title: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  series_name?: string | null;
  series_order?: number | null;
  slug?: string | null;
  phase_title?: string | null;
  story_subtitle?: string | null;
  description?: string | null;
};

export type PresetLessonPickerOption = {
  id: string;
  title: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  passageRefLabel: string;
  storySubtitle?: string | null;
};

export type PresetPhaseGroup = {
  phaseTitle: string;
  lessons: PresetLessonPickerOption[];
};

export type PresetCatalogSeries = {
  seriesName: string;
  phases: PresetPhaseGroup[];
};

function normText(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Stable content fingerprint: same series slot + passage + title ⇒ same picker entry.
 * Different `id` with identical fingerprint ⇒ duplicate (e.g. re-seeded rows).
 */
export function presetStoryPickerContentKey(row: PresetStoryPickerRow): string {
  const slug = row.slug?.trim();
  if (slug) return `slug:${normText(slug)}`;
  const series = row.series_name?.trim() ?? "";
  const order = row.series_order ?? -999999;
  return [
    normText(series),
    order,
    normText(row.book),
    row.chapter,
    row.verse_start,
    row.verse_end,
    normText(row.title),
  ].join("\x1e");
}

/**
 * Preserves input order; keeps first occurrence per `id` and per content fingerprint.
 */
export function dedupePresetStoriesForPicker<T extends PresetStoryPickerRow>(
  rows: T[]
): T[] {
  const seenId = new Set<string>();
  const seenContent = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const id = String(row.id);
    if (seenId.has(id)) continue;
    const ck = presetStoryPickerContentKey(row);
    if (seenContent.has(ck)) continue;
    seenId.add(id);
    seenContent.add(ck);
    out.push(row);
  }
  return out;
}

export function buildPresetStoriesBySeries<T extends PresetStoryPickerRow>(
  rows: T[]
): Record<
  string,
  {
    id: string;
    title: string;
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
  }[]
> {
  const deduped = dedupePresetStoriesForPicker(rows);
  return deduped.reduce<
    Record<
      string,
      {
        id: string;
        title: string;
        book: string;
        chapter: number;
        verse_start: number;
        verse_end: number;
      }[]
    >
  >((acc, s) => {
    const key = s.series_name?.trim() || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: s.id,
      title: s.title,
      book: s.book,
      chapter: s.chapter,
      verse_start: s.verse_start,
      verse_end: s.verse_end,
    });
    return acc;
  }, {});
}

/**
 * Preserves global `series_order` and sub-groups by phase within each series.
 */
export function buildPresetCatalogHierarchy(
  rows: PresetStoryPickerRow[]
): PresetCatalogSeries[] {
  const deduped = dedupePresetStoriesForPicker(rows);
  const sorted = [...deduped].sort(
    (a, b) => (a.series_order ?? 0) - (b.series_order ?? 0)
  );

  const seriesList: PresetCatalogSeries[] = [];
  const seriesIndex = new Map<string, number>();

  for (const r of sorted) {
    const seriesName = r.series_name?.trim() || "Other";
    let si = seriesIndex.get(seriesName);
    if (si == null) {
      si = seriesList.length;
      seriesIndex.set(seriesName, si);
      seriesList.push({ seriesName, phases: [] });
    }
    const series = seriesList[si];
    const phaseTitle = r.phase_title?.trim() || "Lessons";
    let phase = series.phases.find((p) => p.phaseTitle === phaseTitle);
    if (!phase) {
      phase = { phaseTitle, lessons: [] };
      series.phases.push(phase);
    }
    const passageRow = r as unknown as PresetStoryPassageRow;
    phase.lessons.push({
      id: r.id,
      title: r.title,
      book: r.book,
      chapter: r.chapter,
      verse_start: r.verse_start,
      verse_end: r.verse_end,
      passageRefLabel: formatPresetPassageHeader(passageRow),
      storySubtitle: r.story_subtitle ?? null,
    });
  }
  return seriesList;
}
