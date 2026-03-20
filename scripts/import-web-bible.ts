/**
 * Import World English Bible (WEB) from aruljohn/Bible-wmb into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-web-bible.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Load env: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/import-web-bible.ts
 *
 * Data source: https://github.com/aruljohn/Bible-wmb (World Messianic Bible / WEB)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { BIBLE_BOOKS } from "../src/lib/scripture/books";

config({ path: resolve(process.cwd(), ".env.local") });

const WEB_BASE = "https://raw.githubusercontent.com/aruljohn/Bible-wmb/main";

// Bible-wmb uses Hebrew names for some books
const WEB_BOOK_NAME_MAP: Record<string, string> = {
  John: "Yochanan",
  "1 John": "1 Yochanan",
  "2 John": "2 Yochanan",
  "3 John": "3 Yochanan",
  James: "Jacob",
  Jude: "Judah",
};

interface WebVerse {
  verse: string;
  text: string;
}

interface WebChapter {
  chapter: string;
  verses: WebVerse[];
}

interface WebBook {
  book: string;
  chapters: WebChapter[];
}

async function fetchBookJson(bookName: string): Promise<WebBook | null> {
  const webName = WEB_BOOK_NAME_MAP[bookName] ?? bookName;
  const url = `${WEB_BASE}/${encodeURIComponent(webName)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch ${bookName}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add to .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const EXPECTED_BOOK_COUNT = 66;
  const failedBooks: string[] = [];

  console.log("Importing World English Bible (WEB) into Supabase...\n");

  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    const meta = BIBLE_BOOKS[i];
    const bookId = meta.id;
    const bookName = meta.name;
    const testament = meta.testament === "OT" ? "old" : "new";

    console.log(`[${i + 1}/${BIBLE_BOOKS.length}] ${bookName}...`);

    const webBook = await fetchBookJson(bookName);
    if (!webBook) {
      console.error(`  ✗ FAILED (fetch 404 or error)`);
      failedBooks.push(bookName);
      continue;
    }

    const { error: bookError } = await supabase.from("scripture_books").upsert(
      { id: bookId, name: bookName, testament, book_order: i + 1 },
      { onConflict: "id" }
    );
    if (bookError) {
      console.error(`  Book insert error:`, bookError);
      continue;
    }

    let verseCount = 0;
    const chapterNumbers = new Set<number>();
    for (const ch of webBook.chapters) {
      const chapterNum = parseInt(ch.chapter, 10);
      if (isNaN(chapterNum)) continue;
      chapterNumbers.add(chapterNum);

      const verses = ch.verses
        .filter((v) => v.verse && v.text)
        .map((v) => ({
          book_id: bookId,
          chapter_number: chapterNum,
          verse_number: parseInt(v.verse, 10),
          text: v.text.trim(),
          translation: "web",
        }))
        .filter((v) => !isNaN(v.verse_number));

      if (verses.length === 0) continue;

      const { error: verseError } = await supabase
        .from("scripture_verses")
        .upsert(verses, {
          onConflict: "book_id,chapter_number,verse_number,translation",
          ignoreDuplicates: false,
        });

      if (verseError) {
        console.error(`  Chapter ${chapterNum} error:`, verseError);
      } else {
        verseCount += verses.length;
      }
    }

    for (const chNum of chapterNumbers) {
      await supabase.from("scripture_chapters").upsert(
        { book_id: bookId, chapter_number: chNum },
        { onConflict: "book_id,chapter_number" }
      );
    }

    console.log(`  ✓ ${verseCount} verses`);
  }

  if (failedBooks.length > 0) {
    console.error("\n❌ IMPORT INCOMPLETE");
    console.error(`Failed to import ${failedBooks.length} book(s): ${failedBooks.join(", ")}`);
    console.error("Add mappings to WEB_BOOK_NAME_MAP if Bible-wmb uses different filenames.");
    process.exit(1);
  }

  const { count: bookCount } = await supabase
    .from("scripture_books")
    .select("*", { count: "exact", head: true });

  if ((bookCount ?? 0) < EXPECTED_BOOK_COUNT) {
    console.error(`\n❌ Expected ${EXPECTED_BOOK_COUNT} books, found ${bookCount ?? 0}`);
    process.exit(1);
  }

  console.log("\n✓ Import complete. All 66 books imported.");
}

main().catch(console.error);
