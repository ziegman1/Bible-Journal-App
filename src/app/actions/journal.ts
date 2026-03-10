"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveReadingSession(
  book: string,
  chapter: number,
  verseStart: number | null,
  verseEnd: number | null,
  reference: string
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("reading_sessions").insert({
    user_id: user.id,
    book,
    chapter,
    verse_start: verseStart,
    verse_end: verseEnd,
    reference,
  });

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: true };
}

export async function createJournalEntry(data: {
  reference: string;
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
  title?: string;
  userQuestion?: string;
  userReflection?: string;
  prayer?: string;
  application?: string;
  aiResponseId?: string;
  studyThreadId?: string;
  tags?: string[];
  highlightColor?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const now = new Date();
  const entryDate = now.toISOString().split("T")[0];
  const year = now.getFullYear();

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      entry_date: entryDate,
      year,
      book: data.book,
      chapter: data.chapter,
      verse_start: data.verseStart,
      verse_end: data.verseEnd,
      reference: data.reference,
      title: data.title ?? null,
      user_question: data.userQuestion ?? null,
      user_reflection: data.userReflection ?? null,
      prayer: data.prayer ?? null,
      application: data.application ?? null,
      ai_response_id: data.aiResponseId ?? null,
      study_thread_id: data.studyThreadId ?? null,
      highlight_color: data.highlightColor ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: "Could not create entry. Please try again." };

  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-");
      let { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .eq("slug", slug)
        .single();

      if (!tag) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ user_id: user.id, name: tagName, slug })
          .select("id")
          .single();
        tag = newTag;
      }

      if (tag) {
        await supabase.from("journal_entry_tags").insert({
          entry_id: entry.id,
          tag_id: tag.id,
        });
      }
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/journal");
  revalidatePath("/app/themes");
  revalidatePath("/app/annual-journal");

  return { success: true, entryId: entry.id };
}


export async function updateJournalEntry(
  entryId: string,
  data: {
    userReflection?: string;
    prayer?: string;
    application?: string;
    title?: string;
    tags?: string[];
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = {};
  if (data.userReflection !== undefined) updates.user_reflection = data.userReflection;
  if (data.prayer !== undefined) updates.prayer = data.prayer;
  if (data.application !== undefined) updates.application = data.application;
  if (data.title !== undefined) updates.title = data.title;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", entryId)
      .eq("user_id", user.id);
    if (error) return { error: "Could not save changes. Please try again." };
  }

  if (data.tags !== undefined) {
    await supabase.from("journal_entry_tags").delete().eq("entry_id", entryId);

    for (const tagName of data.tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-");
      let { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .eq("slug", slug)
        .single();

      if (!tag) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ user_id: user.id, name: tagName, slug })
          .select("id")
          .single();
        tag = newTag;
      }

      if (tag) {
        await supabase.from("journal_entry_tags").insert({
          entry_id: entryId,
          tag_id: tag.id,
        });
      }
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/journal");
  revalidatePath("/app/journal/" + entryId);
  revalidatePath("/app/themes");
  revalidatePath("/app/annual-journal");

  return { success: true };
}

export async function deleteJournalEntry(entryId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not delete entry. Please try again." };
  revalidatePath("/app");
  revalidatePath("/app/journal");
  revalidatePath("/app/themes");
  revalidatePath("/app/annual-journal");
  return { success: true };
}
