"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates the CHAT SOAPS reading bookmark: last chapter the user finished in the
 * "Start today's SOAPS" reader flow (?chatSoapsGroup=…). Triggered when they reach
 * the end of the chapter (and meet the same dwell-time rule as "mark read"), or when
 * they leave the page after scrolling to the chapter end. Does not use reading_sessions.
 */
export async function recordChatSoapsChapterComplete(
  groupId: string,
  bookId: string,
  completedChapter: number
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  if (!bookId.trim()) return { error: "Missing book" as const };
  if (!Number.isFinite(completedChapter) || completedChapter < 1) {
    return { error: "Invalid chapter" as const };
  }

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") {
    return { error: "Not a CHAT group" as const };
  }

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member of this group" as const };

  const { error } = await supabase.from("chat_soaps_reading_progress").upsert(
    {
      user_id: user.id,
      group_id: groupId,
      book_id: bookId.trim(),
      last_completed_chapter: Math.floor(completedChapter),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,group_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/read");
  revalidatePath(`/app/chat/groups/${groupId}`);
  revalidatePath(`/app/chat/groups/${groupId}/manage`);
  return { success: true as const };
}
