import Papa from "papaparse";
import type { ParsedImportLine } from "@/lib/scripture-module/import-parse";
import { toParsedImportLineFromFields } from "@/lib/scripture-module/import-parse";

/** First non-empty line: if it contains `|`, treat file as pipe-separated; otherwise comma CSV. */
export function detectCsvDelimiter(sample: string): "|" | "," {
  const first = sample.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  return first.includes("|") ? "|" : ",";
}

function looksLikeHeaderRow(cells: string[]): boolean {
  const a = (cells[0] ?? "").trim().toLowerCase();
  return a === "reference" || a === "ref";
}

function rowHasContent(cells: string[]): boolean {
  return cells.some((c) => String(c).trim().length > 0);
}

export type ParseCsvToVersesResult =
  | { ok: false; reason: "invalid_format" | "empty"; message: string }
  | { ok: true; lines: ParsedImportLine[] };

/**
 * Parse CSV text into the same `ParsedImportLine[]` shape as `parseImportBulk` (for `importScriptureVerses`).
 * - Trims fields; empty translation defaults to "ESV".
 * - Skips blank rows; optional header row (Reference / Ref) is skipped.
 * - Rows with fewer than 3 columns are marked failed with a clear error.
 */
export function parseCsvToImportLines(csvText: string): ParseCsvToVersesResult {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty", message: "No valid verses found" };
  }

  const delimiter = detectCsvDelimiter(trimmed);

  const parsed = Papa.parse<string[]>(trimmed, {
    delimiter,
    skipEmptyLines: "greedy",
    header: false,
  });

  const data = (parsed.data as unknown[]).filter(
    (row): row is string[] => Array.isArray(row)
  );

  if (data.length === 0) {
    if (parsed.errors.length > 0) {
      return { ok: false, reason: "invalid_format", message: "Invalid CSV format" };
    }
    return { ok: false, reason: "empty", message: "No valid verses found" };
  }

  const lines: ParsedImportLine[] = [];
  let startIndex = 0;
  const firstCells = data[0]!.map((c) => String(c).trim());
  if (rowHasContent(firstCells) && looksLikeHeaderRow(firstCells)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < data.length; i++) {
    const rawCells = data[i]!.map((c) => String(c).trim());
    if (!rowHasContent(rawCells)) continue;

    const lineNumber = i + 1;

    if (rawCells.length < 3) {
      lines.push({
        ok: false,
        lineNumber,
        error: "Need at least three columns: Reference, Translation, Verse text",
      });
      continue;
    }

    const reference = rawCells[0] ?? "";
    const translation = rawCells[1] ?? "";
    const verseText = rawCells[2] ?? "";
    const listName = rawCells.length >= 4 ? rawCells[3] ?? "" : "";

    lines.push(
      toParsedImportLineFromFields(
        lineNumber,
        {
          reference,
          translation,
          verseText,
          listName: listName || null,
        },
        { defaultTranslationWhenEmpty: "ESV" }
      )
    );
  }

  if (lines.length === 0) {
    return { ok: false, reason: "empty", message: "No valid verses found" };
  }

  return { ok: true, lines };
}
