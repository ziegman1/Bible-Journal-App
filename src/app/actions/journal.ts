"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isMissingSoapsColumnsPostgrestError } from "@/lib/journal/soaps-column-error";

function mergeSoapsIntoReflection(
  observation: string | undefined,
  scripture: string | undefined,
  share: string | undefined
): string | null {
  const parts: string[] = [];
  if (scripture?.trim()) parts.push(`Scripture\n${scripture.trim()}`);
  if (observation?.trim()) parts.push(observation.trim());
  if (share?.trim()) parts.push(`Share\n${share.trim()}`);
  const s = parts.join("\n\n").trim();
  return s.length > 0 ? s : null;
}

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
  /** SOAPS: Observation */
  userReflection?: string;
  prayer?: string;
  application?: string;
  /** SOAPS: verbatim Scripture */
  scriptureText?: string;
  /** SOAPS: Share */
  soapsShare?: string;
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

  const fullRow = {
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
    scripture_text: data.scriptureText ?? null,
    soaps_share: data.soapsShare ?? null,
    ai_response_id: data.aiResponseId ?? null,
    study_thread_id: data.studyThreadId ?? null,
    highlight_color: data.highlightColor ?? null,
  };

  let { data: entry, error } = await supabase
    .from("journal_entries")
    .insert(fullRow)
    .select("id")
    .single();

  if (error && isMissingSoapsColumnsPostgrestError(error.message)) {
    const merged = mergeSoapsIntoReflection(
      data.userReflection,
      data.scriptureText,
      data.soapsShare
    );
    const legacyRow = {
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
      user_reflection: merged,
      prayer: data.prayer ?? null,
      application: data.application ?? null,
      ai_response_id: data.aiResponseId ?? null,
      study_thread_id: data.studyThreadId ?? null,
      highlight_color: data.highlightColor ?? null,
    };
    const second = await supabase
      .from("journal_entries")
      .insert(legacyRow)
      .select("id")
      .single();
    entry = second.data;
    error = second.error;
  }

  if (error) {
    return {
      error:
        error.message?.slice(0, 200) ||
        "Could not create entry. Please try again.",
    };
  }

  if (!entry?.id) {
    return { error: "Could not create entry. Please try again." };
  }

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
  revalidatePath("/app/journal");

  return { success: true, entryId: entry.id };
}


export async function updateJournalEntry(
  entryId: string,
  data: {
    userReflection?: string;
    prayer?: string;
    application?: string;
    scriptureText?: string;
    soapsShare?: string;
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
  if (data.scriptureText !== undefined) updates.scripture_text = data.scriptureText;
  if (data.soapsShare !== undefined) updates.soaps_share = data.soapsShare;
  if (data.title !== undefined) updates.title = data.title;

  if (Object.keys(updates).length > 0) {
    let { error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error && isMissingSoapsColumnsPostgrestError(error.message)) {
      const fallback: Record<string, unknown> = { ...updates };
      delete fallback.scripture_text;
      delete fallback.soaps_share;
      const merged = mergeSoapsIntoReflection(
        data.userReflection,
        data.scriptureText,
        data.soapsShare
      );
      if (merged !== null) fallback.user_reflection = merged;
      const second = await supabase
        .from("journal_entries")
        .update(fallback)
        .eq("id", entryId)
        .eq("user_id", user.id);
      error = second.error;
    }

    if (error) {
      return {
        error:
          error.message?.slice(0, 200) ||
          "Could not save changes. Please try again.",
      };
    }
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
  revalidatePath("/app/journal");

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
  revalidatePath("/app/journal");
  return { success: true };
}
