"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createHighlight(data: {
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  note?: string;
  color?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: highlight, error } = await supabase
    .from("highlights")
    .upsert(
      {
        user_id: user.id,
        book: data.book,
        chapter: data.chapter,
        verse: data.verse,
        reference: data.reference,
        note: data.note ?? null,
        color: data.color ?? "yellow",
      },
      {
        onConflict: "user_id,book,chapter,verse",
        ignoreDuplicates: false,
      }
    )
    .select("id, reference, verse, note, color, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/read");
  return { success: true, highlight };
}

export async function deleteHighlight(highlightId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("highlights")
    .delete()
    .eq("id", highlightId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/read");
  return { success: true };
}

export async function listHighlights(book?: string, chapter?: number) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured", highlights: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", highlights: [] };

  let query = supabase
    .from("highlights")
    .select("id, book, chapter, verse, reference, note, color, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (book) query = query.eq("book", book);
  if (chapter != null) query = query.eq("chapter", chapter);

  const { data: highlights } = await query;
  return { success: true, highlights: highlights ?? [] };
}
