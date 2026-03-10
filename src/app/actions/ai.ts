"use server";

import { createClient } from "@/lib/supabase/server";
import { askAIAboutPassage } from "@/lib/ai/client";
import { getChapter } from "@/lib/scripture/provider";
import { revalidatePath } from "next/cache";

export async function askPassageQuestion(
  bookId: string,
  bookName: string,
  chapter: number,
  verseStart: number | null,
  verseEnd: number | null,
  question: string,
  aiStyle: "concise" | "balanced" | "in-depth" = "balanced",
  options?: { createStudyThread?: boolean; threadId?: string }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const chapterData = await getChapter(bookId, chapter);
  if (!chapterData) return { error: "Chapter not found" };

  let passageText: string;
  let reference: string;

  if (verseStart != null) {
    const start = verseStart;
    const end = verseEnd ?? verseStart;
    const verses = chapterData.verses.filter((v) => v.verse >= start && v.verse <= end);
    passageText = verses.map((v) => `${v.verse} ${v.text}`).join("\n");
    reference = end > start ? `${bookName} ${chapter}:${start}-${end}` : `${bookName} ${chapter}:${start}`;
  } else {
    passageText = chapterData.verses.map((v) => `${v.verse} ${v.text}`).join("\n");
    reference = `${bookName} ${chapter}`;
  }

  const result = await askAIAboutPassage(reference, passageText, question, aiStyle);

  if (!result.success) {
    return { error: result.error };
  }

  const questionText = question.trim() || "Help me understand this passage.";
  let threadId: string | null = options?.threadId ?? null;

  if (options?.createStudyThread && !threadId) {
    const { data: thread, error: threadError } = await supabase
      .from("study_threads")
      .insert({
        user_id: user.id,
        reference,
        book: bookName,
        chapter,
        verse_start: verseStart,
        verse_end: verseEnd,
        title: questionText.slice(0, 80),
      })
      .select("id")
      .single();

    if (threadError) {
      return { error: "Could not create study thread. Please try again." };
    }
    threadId = thread?.id ?? null;

    if (threadId) {
      const { error: msg1Error } = await supabase.from("thread_messages").insert({
        thread_id: threadId,
        role: "user",
        content: questionText,
      });
      if (msg1Error) {
        await supabase.from("study_threads").delete().eq("id", threadId);
        return { error: "Could not save conversation. Please try again." };
      }
      const { error: msg2Error } = await supabase.from("thread_messages").insert({
        thread_id: threadId,
        role: "assistant",
        content: JSON.stringify(result.data),
        structured_ai_response: result.data,
      });
      if (msg2Error) {
        await supabase.from("study_threads").delete().eq("id", threadId);
        return { error: "Could not save AI response. Please try again." };
      }
    }
  } else if (threadId) {
    const { error: msg1Error } = await supabase.from("thread_messages").insert({
      thread_id: threadId,
      role: "user",
      content: questionText,
    });
    if (msg1Error) return { error: "Could not add your question. Please try again." };
    const { error: msg2Error } = await supabase.from("thread_messages").insert({
      thread_id: threadId,
      role: "assistant",
      content: JSON.stringify(result.data),
      structured_ai_response: result.data,
    });
    if (msg2Error) return { error: "Could not save AI response. Please try again." };
  }

  const { data: aiResponse, error } = await supabase
    .from("ai_responses")
    .insert({
      user_id: user.id,
      book: bookName,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      reference,
      question: questionText,
      response_json: result.data,
      model: "gpt-4o-mini",
      thread_id: threadId,
    })
    .select("id")
    .single();

  if (error) return { error: "Could not save AI response. Please try again." };

  revalidatePath("/app");
  revalidatePath("/app/read");
  revalidatePath("/app/journal");
  revalidatePath("/app/threads");
  if (threadId) revalidatePath(`/app/thread/${threadId}`);

  return {
    success: true,
    aiResponseId: aiResponse.id,
    response: result.data,
    threadId: threadId ?? undefined,
  };
}
