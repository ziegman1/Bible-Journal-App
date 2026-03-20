/**
 * Validate WEB Bible import integrity in Supabase.
 *
 * Usage:
 *   npm run import-web  # uses dotenv-cli to load .env.local
 *   npx tsx scripts/validate-web-bible.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const EXPECTED = {
  books: 66,
  chapters: 1189,
  verses: { min: 31090, max: 31110 }, // WEB ~31102; WMB may vary slightly
  james: { verses: 108 },
  jude: { verses: 25 },
};

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("WEB Bible Validation Report\n");
  console.log("=".repeat(50));

  let passed = 0;
  let failed = 0;

  // Book count
  const { count: bookCount } = await supabase
    .from("scripture_books")
    .select("*", { count: "exact", head: true });
  const booksOk = (bookCount ?? 0) === EXPECTED.books;
  console.log(`Books:     ${bookCount ?? 0} / ${EXPECTED.books} ${booksOk ? "✓" : "✗ FAIL"}`);
  booksOk ? passed++ : failed++;

  // Chapter count
  const { count: chapterCount } = await supabase
    .from("scripture_chapters")
    .select("*", { count: "exact", head: true });
  const chaptersOk = (chapterCount ?? 0) === EXPECTED.chapters;
  console.log(`Chapters:  ${chapterCount ?? 0} / ${EXPECTED.chapters} ${chaptersOk ? "✓" : "✗ FAIL"}`);
  chaptersOk ? passed++ : failed++;

  // Verse count
  const { count: verseCount } = await supabase
    .from("scripture_verses")
    .select("*", { count: "exact", head: true })
    .eq("translation", "web");
  const vc = verseCount ?? 0;
  const versesOk = vc >= EXPECTED.verses.min && vc <= EXPECTED.verses.max;
  console.log(`Verses:   ${vc} (expected ${EXPECTED.verses.min}-${EXPECTED.verses.max}) ${versesOk ? "✓" : "✗ FAIL"}`);
  versesOk ? passed++ : failed++;

  // James exists
  const { data: jamesBook } = await supabase
    .from("scripture_books")
    .select("id, name")
    .eq("id", "james")
    .single();
  const jamesExists = !!jamesBook;
  console.log(`James:    ${jamesExists ? "exists" : "MISSING"} ${jamesExists ? "✓" : "✗ FAIL"}`);
  jamesExists ? passed++ : failed++;

  // James verse count
  const { count: jamesVerseCount } = await supabase
    .from("scripture_verses")
    .select("*", { count: "exact", head: true })
    .eq("book_id", "james")
    .eq("translation", "web");
  const jamesVersesOk = (jamesVerseCount ?? 0) === EXPECTED.james.verses;
  console.log(`  James verses: ${jamesVerseCount ?? 0} / ${EXPECTED.james.verses} ${jamesVersesOk ? "✓" : "✗ FAIL"}`);
  jamesVersesOk ? passed++ : failed++;

  // Jude exists
  const { data: judeBook } = await supabase
    .from("scripture_books")
    .select("id, name")
    .eq("id", "jude")
    .single();
  const judeExists = !!judeBook;
  console.log(`Jude:     ${judeExists ? "exists" : "MISSING"} ${judeExists ? "✓" : "✗ FAIL"}`);
  judeExists ? passed++ : failed++;

  // Jude verse count
  const { count: judeVerseCount } = await supabase
    .from("scripture_verses")
    .select("*", { count: "exact", head: true })
    .eq("book_id", "jude")
    .eq("translation", "web");
  const judeVersesOk = (judeVerseCount ?? 0) === EXPECTED.jude.verses;
  console.log(`  Jude verses:  ${judeVerseCount ?? 0} / ${EXPECTED.jude.verses} ${judeVersesOk ? "✓" : "✗ FAIL"}`);
  judeVersesOk ? passed++ : failed++;

  console.log("=".repeat(50));
  console.log(`\nResult: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n❌ VALIDATION FAILED");
    process.exit(1);
  }

  console.log("\n✓ All checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
