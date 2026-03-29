"use client";

import { fetchPassageVersesRangeAction } from "@/app/actions/scripture-passage";

/**
 * Load WEB verses for a passage range. Delegates to a server action (same
 * data path as the scripture reader) so text still loads when direct
 * browser requests to Supabase fail (e.g. privacy tools).
 */
export async function fetchPassageVersesRangeInBrowser(opts: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}): Promise<{ verse: number; text: string }[]> {
  return fetchPassageVersesRangeAction(opts);
}
