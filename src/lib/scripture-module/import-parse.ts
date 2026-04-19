/** Pipe-separated import line: Reference | Translation | Verse text | Optional list name */

export type ParsedImportLine =
  | { ok: true; lineNumber: number; reference: string; translation: string; verseText: string; listName: string | null }
  | { ok: false; lineNumber: number; error: string };

export function normalizeListDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function normalizeListKey(raw: string): string {
  return normalizeListDisplayName(raw).toLowerCase();
}

/**
 * Split on `|` (minimum 3 columns). Optional 4th = list name.
 * Verse text must not contain `|` in V1.
 */
export function parseImportLine(line: string, lineNumber: number): ParsedImportLine {
  const trimmed = line.trim();
  if (!trimmed) {
    return { ok: false, lineNumber, error: "Empty line" };
  }
  const parts = trimmed.split("|").map((p) => p.trim());
  if (parts.length < 3) {
    return {
      ok: false,
      lineNumber,
      error: "Need at least three columns: Reference | Translation | Verse text",
    };
  }
  const reference = parts[0] ?? "";
  const translation = parts[1] ?? "";
  const verseText = parts[2] ?? "";
  const listName =
    parts.length >= 4 && parts[3] != null && parts[3] !== ""
      ? normalizeListDisplayName(parts[3]!)
      : null;
  if (!reference) {
    return { ok: false, lineNumber, error: "Reference is required" };
  }
  if (!verseText) {
    return { ok: false, lineNumber, error: "Verse text is required" };
  }
  return {
    ok: true,
    lineNumber,
    reference,
    translation,
    verseText,
    listName,
  };
}

export function parseImportBulk(text: string): ParsedImportLine[] {
  const lines = text.split(/\r?\n/);
  const out: ParsedImportLine[] = [];
  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;
    if (!line.trim()) continue;
    out.push(parseImportLine(line, lineNumber));
  }
  return out;
}

/**
 * Build a parsed import row without pipe-splitting (used by CSV import where verse text may contain `|`).
 * Optional default translation (e.g. "ESV") when the translation column is empty.
 */
export function toParsedImportLineFromFields(
  lineNumber: number,
  fields: {
    reference: string;
    translation: string;
    verseText: string;
    listName: string | null;
  },
  opts?: { defaultTranslationWhenEmpty?: string }
): ParsedImportLine {
  const reference = fields.reference.trim();
  let translation = fields.translation.trim();
  if (!translation && opts?.defaultTranslationWhenEmpty) {
    translation = opts.defaultTranslationWhenEmpty;
  }
  const verseText = fields.verseText.trim();
  const listName =
    fields.listName != null && fields.listName.trim() !== ""
      ? normalizeListDisplayName(fields.listName)
      : null;
  if (!reference) {
    return { ok: false, lineNumber, error: "Reference is required" };
  }
  if (!verseText) {
    return { ok: false, lineNumber, error: "Verse text is required" };
  }
  return {
    ok: true,
    lineNumber,
    reference,
    translation,
    verseText,
    listName,
  };
}
