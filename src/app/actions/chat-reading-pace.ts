"use server";

import { revalidatePath } from "next/cache";
import {
  computeChatDailySharedReading,
  type ChatDailySharedReadingResult,
} from "@/lib/chat-soaps/chat-daily-shared-reading";
import {
  computeChatReadingPace,
  pairMinChaptersFromPlan,
  practiceTodayYmd,
  type ChatReadingPaceResult,
} from "@/lib/chat-soaps/reading-pace";
import { refreshChatGroupPairSharedProgress } from "@/lib/chat-soaps/pair-pace-sync";
import { getBookById } from "@/lib/scripture/books";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

export type ChatReadingPaceSettings = {
  reading_start_date: string;
  chapters_per_day: number;
  plan_start_book_id: string;
  plan_start_chapter: number;
};

export type ChatReadingPaceBundle = {
  settings: ChatReadingPaceSettings;
  pace: ChatReadingPaceResult;
  dailyShared: ChatDailySharedReadingResult;
};

export async function getChatReadingPaceBundle(
  groupId: string
): Promise<{ error: string } | ChatReadingPaceBundle> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  const tz = await getPracticeTimeZone();

  let { data: paceRow } = await supabase
    .from("chat_group_reading_pace")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();

  if (!paceRow) {
    const today = practiceTodayYmd(new Date(), tz);
    await supabase.from("chat_group_reading_pace").insert({
      group_id: groupId,
      reading_start_date: today,
      chapters_per_day: 1,
      plan_start_book_id: "matthew",
      plan_start_chapter: 1,
      pair_shared_chapters_from_plan: 0,
    });
    const { data: again } = await supabase
      .from("chat_group_reading_pace")
      .select("*")
      .eq("group_id", groupId)
      .maybeSingle();
    paceRow = again;
  }

  if (!paceRow) return { error: "Could not load reading pace" };

  const { data: progressRows } = await supabase
    .from("chat_soaps_reading_progress")
    .select("user_id, book_id, last_completed_chapter")
    .eq("group_id", groupId);

  const pairProgressChaptersFromPlan = pairMinChaptersFromPlan(
    paceRow.plan_start_book_id,
    paceRow.plan_start_chapter,
    progressRows ?? []
  );

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const memberUserIds = (memberRows ?? []).map((m) => m.user_id).filter(Boolean);

  const eventsSince = new Date();
  eventsSince.setMonth(eventsSince.getMonth() - 9);
  const { data: eventRows, error: eventsError } = await supabase
    .from("chat_soaps_chapter_events")
    .select("user_id, book_id, chapter, completed_at")
    .eq("group_id", groupId)
    .gte("completed_at", eventsSince.toISOString());

  const todayYmd = practiceTodayYmd(new Date(), tz);
  const pacePairStored = (paceRow as { pair_shared_chapters_from_plan?: unknown })
    .pair_shared_chapters_from_plan;
  const pairSharedForDaily =
    typeof pacePairStored === "number" && Number.isFinite(pacePairStored)
      ? pacePairStored
      : pairProgressChaptersFromPlan;

  const dailyShared = computeChatDailySharedReading({
    practiceDateYmd: todayYmd,
    practiceTimeZone: tz,
    planStartBookId: paceRow.plan_start_book_id,
    planStartChapter: paceRow.plan_start_chapter,
    pairSharedChaptersFromPlan: pairSharedForDaily,
    memberUserIds,
    events: eventsError ? [] : (eventRows ?? []),
    progressRows: progressRows ?? [],
  });

  const readingStartDateYmd =
    typeof paceRow.reading_start_date === "string"
      ? paceRow.reading_start_date.slice(0, 10)
      : practiceTodayYmd(new Date(), tz);

  const pace = computeChatReadingPace({
    readingStartDateYmd,
    chaptersPerDay: paceRow.chapters_per_day,
    planStartBookId: paceRow.plan_start_book_id,
    planStartChapter: paceRow.plan_start_chapter,
    pairProgressChaptersFromPlan,
    practiceTimeZone: tz,
  });

  return {
    settings: {
      reading_start_date: readingStartDateYmd,
      chapters_per_day: paceRow.chapters_per_day,
      plan_start_book_id: paceRow.plan_start_book_id,
      plan_start_chapter: paceRow.plan_start_chapter,
    },
    pace,
    dailyShared,
  };
}

export async function updateChatGroupReadingPace(
  groupId: string,
  payload: {
    readingStartDate: string;
    chaptersPerDay: number;
    planStartBookId: string;
    planStartChapter: number;
  }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  const book = getBookById(payload.planStartBookId.trim());
  if (!book) return { error: "Unknown book" };

  const ch = Math.floor(payload.planStartChapter);
  if (!Number.isFinite(ch) || ch < 1 || ch > book.chapterCount) {
    return { error: "Invalid start chapter for this book" };
  }

  const cpd = Math.floor(payload.chaptersPerDay);
  if (!Number.isFinite(cpd) || cpd < 1 || cpd > 15) {
    return { error: "Chapters per day must be between 1 and 15" };
  }

  const dateT = payload.readingStartDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateT)) {
    return { error: "Use a valid start date" };
  }

  const { error } = await supabase.from("chat_group_reading_pace").upsert(
    {
      group_id: groupId,
      reading_start_date: dateT,
      chapters_per_day: cpd,
      plan_start_book_id: book.id,
      plan_start_chapter: ch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );

  if (error) return { error: error.message };

  const tz = await getPracticeTimeZone();
  await refreshChatGroupPairSharedProgress(
    supabase,
    groupId,
    book.id,
    ch,
    tz,
    "plan_edit"
  );

  revalidatePath("/app");
  revalidatePath(`/app/chat/groups/${groupId}`);
  revalidatePath(`/app/chat/groups/${groupId}/manage`);
  revalidatePath("/app/chat");
  return { success: true as const };
}
