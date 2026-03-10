import type { BookInfo } from "./types";

export const BIBLE_BOOKS: BookInfo[] = [
  { id: "genesis", name: "Genesis", testament: "OT", chapterCount: 50 },
  { id: "exodus", name: "Exodus", testament: "OT", chapterCount: 40 },
  { id: "leviticus", name: "Leviticus", testament: "OT", chapterCount: 27 },
  { id: "numbers", name: "Numbers", testament: "OT", chapterCount: 36 },
  { id: "deuteronomy", name: "Deuteronomy", testament: "OT", chapterCount: 34 },
  { id: "joshua", name: "Joshua", testament: "OT", chapterCount: 24 },
  { id: "judges", name: "Judges", testament: "OT", chapterCount: 21 },
  { id: "ruth", name: "Ruth", testament: "OT", chapterCount: 4 },
  { id: "1samuel", name: "1 Samuel", testament: "OT", chapterCount: 31 },
  { id: "2samuel", name: "2 Samuel", testament: "OT", chapterCount: 24 },
  { id: "1kings", name: "1 Kings", testament: "OT", chapterCount: 22 },
  { id: "2kings", name: "2 Kings", testament: "OT", chapterCount: 25 },
  { id: "1chronicles", name: "1 Chronicles", testament: "OT", chapterCount: 29 },
  { id: "2chronicles", name: "2 Chronicles", testament: "OT", chapterCount: 36 },
  { id: "ezra", name: "Ezra", testament: "OT", chapterCount: 10 },
  { id: "nehemiah", name: "Nehemiah", testament: "OT", chapterCount: 13 },
  { id: "esther", name: "Esther", testament: "OT", chapterCount: 10 },
  { id: "job", name: "Job", testament: "OT", chapterCount: 42 },
  { id: "psalms", name: "Psalms", testament: "OT", chapterCount: 150 },
  { id: "proverbs", name: "Proverbs", testament: "OT", chapterCount: 31 },
  { id: "ecclesiastes", name: "Ecclesiastes", testament: "OT", chapterCount: 12 },
  { id: "songofsolomon", name: "Song of Solomon", testament: "OT", chapterCount: 8 },
  { id: "isaiah", name: "Isaiah", testament: "OT", chapterCount: 66 },
  { id: "jeremiah", name: "Jeremiah", testament: "OT", chapterCount: 52 },
  { id: "lamentations", name: "Lamentations", testament: "OT", chapterCount: 5 },
  { id: "ezekiel", name: "Ezekiel", testament: "OT", chapterCount: 48 },
  { id: "daniel", name: "Daniel", testament: "OT", chapterCount: 12 },
  { id: "hosea", name: "Hosea", testament: "OT", chapterCount: 14 },
  { id: "joel", name: "Joel", testament: "OT", chapterCount: 3 },
  { id: "amos", name: "Amos", testament: "OT", chapterCount: 9 },
  { id: "obadiah", name: "Obadiah", testament: "OT", chapterCount: 1 },
  { id: "jonah", name: "Jonah", testament: "OT", chapterCount: 4 },
  { id: "micah", name: "Micah", testament: "OT", chapterCount: 7 },
  { id: "nahum", name: "Nahum", testament: "OT", chapterCount: 3 },
  { id: "habakkuk", name: "Habakkuk", testament: "OT", chapterCount: 3 },
  { id: "zephaniah", name: "Zephaniah", testament: "OT", chapterCount: 3 },
  { id: "haggai", name: "Haggai", testament: "OT", chapterCount: 2 },
  { id: "zechariah", name: "Zechariah", testament: "OT", chapterCount: 14 },
  { id: "malachi", name: "Malachi", testament: "OT", chapterCount: 4 },
  { id: "matthew", name: "Matthew", testament: "NT", chapterCount: 28 },
  { id: "mark", name: "Mark", testament: "NT", chapterCount: 16 },
  { id: "luke", name: "Luke", testament: "NT", chapterCount: 24 },
  { id: "john", name: "John", testament: "NT", chapterCount: 21 },
  { id: "acts", name: "Acts", testament: "NT", chapterCount: 28 },
  { id: "romans", name: "Romans", testament: "NT", chapterCount: 16 },
  { id: "1corinthians", name: "1 Corinthians", testament: "NT", chapterCount: 16 },
  { id: "2corinthians", name: "2 Corinthians", testament: "NT", chapterCount: 13 },
  { id: "galatians", name: "Galatians", testament: "NT", chapterCount: 6 },
  { id: "ephesians", name: "Ephesians", testament: "NT", chapterCount: 6 },
  { id: "philippians", name: "Philippians", testament: "NT", chapterCount: 4 },
  { id: "colossians", name: "Colossians", testament: "NT", chapterCount: 4 },
  { id: "1thessalonians", name: "1 Thessalonians", testament: "NT", chapterCount: 5 },
  { id: "2thessalonians", name: "2 Thessalonians", testament: "NT", chapterCount: 3 },
  { id: "1timothy", name: "1 Timothy", testament: "NT", chapterCount: 6 },
  { id: "2timothy", name: "2 Timothy", testament: "NT", chapterCount: 4 },
  { id: "titus", name: "Titus", testament: "NT", chapterCount: 3 },
  { id: "philemon", name: "Philemon", testament: "NT", chapterCount: 1 },
  { id: "hebrews", name: "Hebrews", testament: "NT", chapterCount: 13 },
  { id: "james", name: "James", testament: "NT", chapterCount: 5 },
  { id: "1peter", name: "1 Peter", testament: "NT", chapterCount: 5 },
  { id: "2peter", name: "2 Peter", testament: "NT", chapterCount: 3 },
  { id: "1john", name: "1 John", testament: "NT", chapterCount: 5 },
  { id: "2john", name: "2 John", testament: "NT", chapterCount: 1 },
  { id: "3john", name: "3 John", testament: "NT", chapterCount: 1 },
  { id: "jude", name: "Jude", testament: "NT", chapterCount: 1 },
  { id: "revelation", name: "Revelation", testament: "NT", chapterCount: 22 },
];

export function getBookById(id: string): BookInfo | undefined {
  return BIBLE_BOOKS.find((b) => b.id === id);
}

export function getBookByName(name: string): BookInfo | undefined {
  return BIBLE_BOOKS.find(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  );
}

export function getBookIdFromName(name: string): string | undefined {
  return getBookByName(name)?.id;
}
