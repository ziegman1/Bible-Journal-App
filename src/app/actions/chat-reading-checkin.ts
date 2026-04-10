"use server";

import { revalidatePath } from "next/cache";
import {
  countChaptersThroughInclusiveBookmark,
  practiceTodayYmd,
  practiceWeekStartSundayYmd,
} from "@/lib/chat-soaps/reading-pace";
import { getBookById } from "@/lib/scripture/books";
import { createClient } from "@/lib/supabase/server";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";

export type ChatReadingCheckInRow = {
  week_start_ymd: string;
  kept_up: boolean;
  restart_book_id: string | null;
  restart_chapter: number | null;
  grace_was_applied: boolean;
};

type RpcGracePayload = {
  ok?: boolean;
  grace_applied?: boolean;
  error?: string;
  reason?: string;
};

export async function getChatReadingCheckinForWeek(
  groupId: string
): Promise<{ error: string } | { row: ChatReadingCheckInRow | null }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tz = await getPracticeTimeZone();
  const weekStart = practiceWeekStartSundayYmd(new Date(), tz);

  const { data, error } = await supabase
    .from("chat_reading_check_ins")
    .select("week_start_ymd, kept_up, restart_book_id, restart_chapter, grace_was_applied")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("week_start_ymd", weekStart)
    .maybeSingle();

  if (error) return { error: error.message };

  if (!data) return { row: null };

  return {
    row: {
      week_start_ymd: String(data.week_start_ymd).slice(0, 10),
      kept_up: Boolean(data.kept_up),
      restart_book_id: data.restart_book_id ? String(data.restart_book_id) : null,
      restart_chapter:
        typeof data.restart_chapter === "number" ? data.restart_chapter : null,
      grace_was_applied: Boolean(data.grace_was_applied),
    },
  };
}

export async function submitChatReadingCheckIn(input: {
  groupId: string;
  keptUp: boolean;
  restartBookId?: string;
  restartChapter?: number;
}): Promise<
  { error: string } | { success: true; graceApplied: boolean; skippedDuplicateWeek?: boolean }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: grp } = await supabase
    .from("groups")
    .select("group_kind")
    .eq("id", input.groupId)
    .single();
  if (!grp || grp.group_kind !== "chat") return { error: "Not a CHAT group" };

  const { data: mem } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", input.groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return { error: "Not a member" };

  const tz = await getPracticeTimeZone();
  const weekStart = practiceWeekStartSundayYmd(new Date(), tz);
  const todayYmd = practiceTodayYmd(new Date(), tz);

  if (input.keptUp) {
    const { error: upErr } = await supabase.from("chat_reading_check_ins").upsert(
      {
        group_id: input.groupId,
        user_id: user.id,
        week_start_ymd: weekStart,
        kept_up: true,
        restart_book_id: null,
        restart_chapter: null,
        grace_was_applied: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id,user_id,week_start_ymd" }
    );
    if (upErr) return { error: upErr.message };

    revalidatePath(`/app/chat/groups/${input.groupId}`);
    revalidatePath("/app");
    return { success: true, graceApplied: false };
  }

  const bookId = (input.restartBookId ?? "").trim();
  const ch = input.restartChapter;
  if (!bookId || !Number.isFinite(ch) || (ch as number) < 1) {
    return { error: "Choose where you are picking back up (book and chapter)." };
  }

  const book = getBookById(bookId);
  if (!book) return { error: "Unknown book" };

  const chapter = Math.floor(ch as number);
  if (chapter < 1 || chapter > book.chapterCount) {
    return { error: "Invalid chapter for this book" };
  }

  let { data: paceRow } = await supabase
    .from("chat_group_reading_pace")
    .select("plan_start_book_id, plan_start_chapter")
    .eq("group_id", input.groupId)
    .maybeSingle();

  if (!paceRow) {
    await supabase.from("chat_group_reading_pace").insert({
      group_id: input.groupId,
      reading_start_date: todayYmd,
      chapters_per_day: 1,
      plan_start_book_id: "matthew",
      plan_start_chapter: 1,
      pair_shared_chapters_from_plan: 0,
    });
    const { data: again } = await supabase
      .from("chat_group_reading_pace")
      .select("plan_start_book_id, plan_start_chapter")
      .eq("group_id", input.groupId)
      .maybeSingle();
    paceRow = again;
  }

  if (!paceRow) return { error: "Could not load reading pace for this group" };

  const chaptersFromPlan = countChaptersThroughInclusiveBookmark(
    paceRow.plan_start_book_id,
    paceRow.plan_start_chapter,
    book.id,
    chapter
  );

  if (chaptersFromPlan < 1) {
    return {
      error:
        "That chapter is before your group's plan start. Pick a book and chapter on or after where your plan begins (Manage → reading pace).",
    };
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    "apply_chat_reading_grace_for_group",
    {
      p_group_id: input.groupId,
      p_actor_user_id: user.id,
      p_week_start_ymd: weekStart,
      p_reading_start_date: todayYmd,
      p_pair_shared_chapters: chaptersFromPlan,
      p_restart_book_id: book.id,
      p_restart_chapter: chapter,
    }
  );

  if (rpcErr) return { error: rpcErr.message };

  const payload = rpcData as RpcGracePayload | null;
  if (!payload?.ok) {
    return { error: payload?.error ?? "Could not apply reading grace" };
  }

  const graceApplied = Boolean(payload.grace_applied);
  const skippedDuplicateWeek =
    !graceApplied && payload.reason === "duplicate_week";

  const { error: upErr } = await supabase.from("chat_reading_check_ins").upsert(
    {
      group_id: input.groupId,
      user_id: user.id,
      week_start_ymd: weekStart,
      kept_up: false,
      restart_book_id: book.id,
      restart_chapter: chapter,
      grace_was_applied: graceApplied,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,user_id,week_start_ymd" }
  );
  if (upErr) return { error: upErr.message };

  revalidatePath(`/app/chat/groups/${input.groupId}`);
  revalidatePath(`/app/chat/groups/${input.groupId}/manage`);
  revalidatePath("/app/chat");
  revalidatePath("/app");

  return { success: true, graceApplied, skippedDuplicateWeek };
}
