import type { LibraryVerseRow } from "@/app/actions/scripture-module";

export type LibraryFilterPreset =
  | "all"
  | "not_started"
  | "in_progress"
  | "grip_completed"
  | "due_review";

export function parseLibraryFilter(raw: string | undefined): LibraryFilterPreset {
  if (
    raw === "not_started" ||
    raw === "in_progress" ||
    raw === "grip_completed" ||
    raw === "due_review"
  ) {
    return raw;
  }
  return "all";
}

export function filterLibraryRows(
  rows: LibraryVerseRow[],
  filter: LibraryFilterPreset,
  listId: string | null,
  q: string,
  listNameById: Map<string, string>
): LibraryVerseRow[] {
  const qn = q.trim().toLowerCase();
  return rows.filter((row) => {
    if (listId && !row.listIds.includes(listId)) return false;
    if (filter === "not_started" && row.grip !== "not_started") return false;
    if (filter === "in_progress" && row.grip !== "in_progress") return false;
    if (filter === "grip_completed" && row.grip !== "completed") return false;
    if (filter === "due_review" && !row.reviewDue) return false;
    if (qn) {
      const ref = row.item.reference.toLowerCase();
      const text = row.item.verseText.toLowerCase();
      const matchContent = ref.includes(qn) || text.includes(qn);
      const matchList = row.listIds.some((lid) =>
        (listNameById.get(lid) ?? "").toLowerCase().includes(qn)
      );
      if (!matchContent && !matchList) return false;
    }
    return true;
  });
}

export function scriptureLibraryHref(params: {
  filter?: LibraryFilterPreset;
  list?: string | null;
  q?: string | null;
}): string {
  const p = new URLSearchParams();
  if (params.filter && params.filter !== "all") p.set("filter", params.filter);
  if (params.list) p.set("list", params.list);
  const qq = params.q?.trim();
  if (qq) p.set("q", qq);
  const s = p.toString();
  return `/scripture${s ? `?${s}` : ""}`;
}
