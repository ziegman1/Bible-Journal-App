export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  book: string;
  bookId: string;
  chapter: number;
  verses: Verse[];
}

export interface BookInfo {
  id: string;
  name: string;
  testament: "OT" | "NT";
  chapterCount: number;
}

export interface ScriptureReference {
  book: string;
  bookId: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

export function formatReference(ref: ScriptureReference): string {
  if (ref.verseStart && ref.verseEnd && ref.verseStart !== ref.verseEnd) {
    return `${ref.book} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
  }
  if (ref.verseStart) {
    return `${ref.book} ${ref.chapter}:${ref.verseStart}`;
  }
  return `${ref.book} ${ref.chapter}`;
}
