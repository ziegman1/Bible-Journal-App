"use client";

import { useEffect } from "react";
import { saveReadingSession } from "@/app/actions/journal";

interface SaveReadingSessionProps {
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  reference: string;
}

/** Saves reading session on mount. Must be client component to avoid revalidatePath during render. */
export function SaveReadingSession({
  book,
  chapter,
  verseStart,
  verseEnd,
  reference,
}: SaveReadingSessionProps) {
  useEffect(() => {
    saveReadingSession(book, chapter, verseStart, verseEnd, reference);
  }, [book, chapter, verseStart, verseEnd, reference]);
  return null;
}
