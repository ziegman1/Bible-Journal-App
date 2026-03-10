"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudyThread(data: {
  reference: string;
  book: string;
  chapter: number;
  verseStart?: number | null;
  verseEnd?: number | null;
  title?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: thread, error } = await supabase
    .from("study_threads")
    .insert({
      user_id: user.id,
      reference: data.reference,
      book: data.book,
      chapter: data.chapter,
      verse_start: data.verseStart ?? null,
      verse_end: data.verseEnd ?? null,
      title: data.title ?? null,
    })
    .select("id, reference, title, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/read");
  return { success: true, thread };
}

export async function addThreadMessage(
  threadId: string,
  role: "user" | "assistant" | "system",
  content: string,
  structuredAiResponse?: Record<string, unknown> | null
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: thread } = await supabase
    .from("study_threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!thread) return { error: "Thread not found" };

  const { data: message, error } = await supabase
    .from("thread_messages")
    .insert({
      thread_id: threadId,
      role,
      content,
      structured_ai_response: structuredAiResponse ?? null,
    })
    .select("id, role, content, structured_ai_response, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: true, message };
}

export async function getStudyThread(threadId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured", thread: null, messages: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", thread: null, messages: null };

  const { data: thread, error: threadError } = await supabase
    .from("study_threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .single();

  if (threadError || !thread) return { error: "Thread not found", thread: null, messages: null };

  const { data: messages } = await supabase
    .from("thread_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return { success: true, thread, messages: messages ?? [] };
}

export async function listStudyThreads(limit = 20) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured", threads: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", threads: [] };

  const { data: threads } = await supabase
    .from("study_threads")
    .select("id, reference, title, book, chapter, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { success: true, threads: threads ?? [] };
}

export async function deleteStudyThread(threadId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("study_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not delete thread. Please try again." };
  revalidatePath("/app");
  revalidatePath("/app/read");
  revalidatePath("/app/threads");
  revalidatePath(`/app/thread/${threadId}`);
  return { success: true };
}
