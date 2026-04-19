/**
 * Reference → compact **typing/scoring** token for recall exercises (internal only).
 *
 * **Display:** The UI shows `scripture_items.reference` as-is (e.g. `Romans 10:9`) at the start and
 * end of whole-passage recall. That string is **not** the same as this token; scoring still uses
 * the per-character token below.
 *
 * Reference → compact typing token for first-letter recall exercises.
 *
 * **Normalization rule**
 * 1. Trim the reference string.
 * 2. Match a trailing chapter:verse (`\\b(\\d+)\\s*:\\s*(\\d+)(?:\\s*-\\s*\\d+)?\\s*$`). Verse ranges
 *    (e.g. `3:16-18`) are ignored for the token; only the first verse number is used.
 * 3. **Book portion** (text before that match): split on whitespace. For each token:
 *    - If the token is all digits, append those digits as-is (e.g. leading `1` in `1 John`).
 *    - Otherwise append the first Latin letter, lowercased (first letter of each book word).
 * 4. **Chapter and verse**: append chapter digits, then verse digits, with no colon (e.g. `3` + `16` → `316`).
 * 5. If no `chapter:verse` match, fall back: first letter of each whitespace token that has a letter, plus
 *    all digit runs concatenated in order (best-effort).
 *
 * Examples (documented):
 * - `John 3:16` → `j316`
 * - `Romans 12:2` → `r122`
 * - `1 John 4:19` → `1j419`
 * - `Psalm 23:1` → `p231`
 */
export function referenceToTypingToken(reference: string): string {
  const s = reference.trim();
  if (!s) return "";

  const cvMatch = s.match(/\b(\d+)\s*:\s*(\d+)(?:\s*-\s*\d+)?\s*$/);
  if (cvMatch) {
    const chapter = cvMatch[1]!;
    const verse = cvMatch[2]!;
    const before = s.slice(0, s.lastIndexOf(cvMatch[0]!)).trim();
    let out = "";
    for (const part of before.split(/\s+/).filter(Boolean)) {
      if (/^\d+$/.test(part)) {
        out += part;
      } else {
        const m = part.match(/[A-Za-z]/);
        if (m) out += m[0]!.toLowerCase();
      }
    }
    out += chapter + verse;
    return out;
  }

  return fallbackReferenceToken(s);
}

function fallbackReferenceToken(s: string): string {
  let out = "";
  for (const part of s.split(/\s+/).filter(Boolean)) {
    if (/^\d+$/.test(part)) {
      out += part;
      continue;
    }
    const m = part.match(/[A-Za-z]/);
    if (m) out += m[0]!.toLowerCase();
    const digits = part.replace(/\D/g, "");
    if (digits && !/^\d+$/.test(part)) out += digits;
  }
  return out;
}

/** Stages that prepend/append the reference token around passage words (memorize + review). */
export function recallStagesIncludeReference(stage: string): boolean {
  return stage === "stage_4" || stage === "stage_5";
}
