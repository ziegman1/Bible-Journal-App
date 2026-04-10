"use server";

import { listGroupsForUser } from "@/app/actions/groups";
import { nextReadAfterChatSoapsComplete } from "@/lib/chat-soaps/next-read";
import { createClient } from "@/lib/supabase/server";

/** Same “Start today’s SOAPS” target as the dashboard ME / BADWR primary action. */
export async function getSoapsHomeActionHref(): Promise<{
  href: string;
  label: string;
}> {
  const label = "Start today’s SOAPS";
  let href = "/app/read/matthew/1";

  const supabase = await createClient();
  if (!supabase) return { href, label };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { href, label };

  const listResult = await listGroupsForUser({ groupKind: "chat" });
  const chatGroups = "groups" in listResult ? (listResult.groups ?? []) : [];
  const primaryChat = chatGroups[0];
  if (!primaryChat) return { href, label };

  const { data: progress } = await supabase
    .from("chat_soaps_reading_progress")
    .select("book_id, last_completed_chapter")
    .eq("user_id", user.id)
    .eq("group_id", primaryChat.id)
    .maybeSingle();

  const target = nextReadAfterChatSoapsComplete(
    progress?.book_id,
    progress?.last_completed_chapter
  );
  href = `/app/read/${target.bookId}/${target.chapter}?chatSoapsGroup=${encodeURIComponent(primaryChat.id)}`;

  return { href, label };
}
