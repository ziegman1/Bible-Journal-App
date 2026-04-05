import {
  pairMinChaptersFromPlan,
  practiceTodayYmd,
} from "@/lib/chat-soaps/reading-pace";
import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export type PairPaceSyncMode = "soaps_save" | "plan_edit";

/**
 * Recomputes pair-wide progress (min bookmark among members with CHAT SOAPS progress) and persists
 * `pair_shared_chapters_from_plan`. On SOAPS save, if that minimum moves backward (grace / realign),
 * resets `reading_start_date` to today so the calendar expectation does not penalize the pair.
 */
export async function refreshChatGroupPairSharedProgress(
  supabase: ServerSupabase,
  groupId: string,
  planStartBookId: string,
  planStartChapter: number,
  practiceTz: string,
  mode: PairPaceSyncMode
): Promise<{ ok: true; pairSharedChapters: number; graceReset: boolean } | { ok: false; error: string }> {
  const { data: progressRows, error: progErr } = await supabase
    .from("chat_soaps_reading_progress")
    .select("book_id, last_completed_chapter")
    .eq("group_id", groupId);

  if (progErr) return { ok: false, error: progErr.message };

  const newMin = pairMinChaptersFromPlan(
    planStartBookId,
    planStartChapter,
    progressRows ?? []
  );

  const todayYmd = practiceTodayYmd(new Date(), practiceTz);

  const { data: fullPace, error: paceErr } = await supabase
    .from("chat_group_reading_pace")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();

  if (paceErr) return { ok: false, error: paceErr.message };

  if (!fullPace) {
    const { error: insErr } = await supabase.from("chat_group_reading_pace").insert({
      group_id: groupId,
      reading_start_date: todayYmd,
      chapters_per_day: 1,
      plan_start_book_id: planStartBookId,
      plan_start_chapter: planStartChapter,
      pair_shared_chapters_from_plan: newMin,
      updated_at: new Date().toISOString(),
    });
    if (!insErr) return { ok: true, pairSharedChapters: newMin, graceReset: false };
    if (insErr.code === "23505") {
      return refreshChatGroupPairSharedProgress(
        supabase,
        groupId,
        planStartBookId,
        planStartChapter,
        practiceTz,
        mode
      );
    }
    return { ok: false, error: insErr.message };
  }

  const stored = (fullPace as { pair_shared_chapters_from_plan?: unknown })
    .pair_shared_chapters_from_plan;
  const oldStored =
    typeof stored === "number" && Number.isFinite(stored) ? stored : 0;

  const graceReset = mode === "soaps_save" && newMin < oldStored;

  const updatePayload: {
    pair_shared_chapters_from_plan: number;
    updated_at: string;
    reading_start_date?: string;
  } = {
    pair_shared_chapters_from_plan: newMin,
    updated_at: new Date().toISOString(),
  };

  if (graceReset) {
    updatePayload.reading_start_date = todayYmd;
  }

  const { error: updErr } = await supabase
    .from("chat_group_reading_pace")
    .update(updatePayload)
    .eq("group_id", groupId);

  if (updErr) return { ok: false, error: updErr.message };

  return { ok: true, pairSharedChapters: newMin, graceReset };
}
