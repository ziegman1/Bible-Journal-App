"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addFavoritePassage(data: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: favorite, error } = await supabase
    .from("favorite_passages")
    .upsert(
      {
        user_id: user.id,
        book: data.book,
        chapter: data.chapter,
        verse_start: data.verseStart,
        verse_end: data.verseEnd,
        reference: data.reference,
      },
      {
        onConflict: "user_id,book,chapter,verse_start,verse_end",
        ignoreDuplicates: false,
      }
    )
    .select("id, reference, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/read");
  return { success: true, favorite };
}

export async function removeFavoritePassage(favoriteId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("favorite_passages")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/read");
  return { success: true };
}

export async function listFavoritePassages() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured", favorites: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", favorites: [] };

  const { data: favorites } = await supabase
    .from("favorite_passages")
    .select("id, reference, book, chapter, verse_start, verse_end, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { success: true, favorites: favorites ?? [] };
}

export async function getFavoriteForPassage(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
) {
  const supabase = await createClient();
  if (!supabase) return { favorited: false, favoriteId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { favorited: false, favoriteId: null };

  const { data } = await supabase
    .from("favorite_passages")
    .select("id")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse_start", verseStart)
    .eq("verse_end", verseEnd)
    .single();

  return { favorited: !!data, favoriteId: data?.id ?? null };
}
