import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" });
  }

  const { data: book } = await supabase
    .from("scripture_books")
    .select("id")
    .eq("id", "mark")
    .single();

  const { data: verses, error } = await supabase
    .from("scripture_verses")
    .select("verse_number, text")
    .eq("book_id", "mark")
    .eq("chapter_number", 1)
    .eq("translation", "web")
    .limit(3);

  return NextResponse.json({
    ok: !error && (verses?.length ?? 0) > 0,
    bookExists: !!book,
    verseCount: verses?.length ?? 0,
    error: error?.message ?? null,
  });
}
