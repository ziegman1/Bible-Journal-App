"use server";

import { revalidatePath } from "next/cache";
import { startOfUtcWeekMonday, utcDateYmd } from "@/lib/dashboard/utc-week";
import { fetchThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";
import {
  buildSuggestedLookForward,
  currentUtcWeekMondayYmd,
  formatThirdsPersonalPassageRef,
  type PriorFinalizedCommitments,
} from "@/lib/groups/thirds-personal-helpers";
import type {
  ThirdsParticipationStats,
  ThirdsPersonalWeekDTO,
  ThirdsPersonalWorkspacePayload,
} from "@/lib/groups/thirds-personal-types";
import { createClient } from "@/lib/supabase/server";
import { getChapter, sliceChapterByVerseRange } from "@/lib/scripture/web";

async function fetchPriorFinalizedWeek(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  beforeMondayYmd: string
): Promise<PriorFinalizedCommitments | null> {
  const { data, error } = await supabase
    .from("thirds_personal_weeks")
    .select(
      "week_start_monday, obedience_statement, sharing_commitment, train_commitment, finalized_at"
    )
    .eq("user_id", userId)
    .lt("week_start_monday", beforeMondayYmd)
    .not("finalized_at", "is", null)
    .order("week_start_monday", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    weekStartMonday: data.week_start_monday,
    obedience_statement: data.obedience_statement ?? "",
    sharing_commitment: data.sharing_commitment ?? "",
    train_commitment: data.train_commitment ?? "",
  };
}

function rowToDto(r: Record<string, unknown>): ThirdsPersonalWeekDTO {
  return {
    id: String(r.id),
    week_start_monday: String(r.week_start_monday),
    prior_obedience_done: Boolean(r.prior_obedience_done),
    prior_sharing_done: Boolean(r.prior_sharing_done),
    prior_train_done: Boolean(r.prior_train_done),
    passage_ref: String(r.passage_ref ?? ""),
    look_up_preset_story_id:
      r.look_up_preset_story_id != null ? String(r.look_up_preset_story_id) : null,
    look_up_book: String(r.look_up_book ?? ""),
    look_up_chapter:
      typeof r.look_up_chapter === "number" && Number.isFinite(r.look_up_chapter)
        ? r.look_up_chapter
        : null,
    look_up_verse_start:
      typeof r.look_up_verse_start === "number" && Number.isFinite(r.look_up_verse_start)
        ? r.look_up_verse_start
        : null,
    look_up_verse_end:
      typeof r.look_up_verse_end === "number" && Number.isFinite(r.look_up_verse_end)
        ? r.look_up_verse_end
        : null,
    observation_like: String(r.observation_like ?? ""),
    observation_difficult: String(r.observation_difficult ?? ""),
    observation_teaches_people: String(r.observation_teaches_people ?? ""),
    observation_teaches_god: String(r.observation_teaches_god ?? ""),
    obedience_statement: String(r.obedience_statement ?? ""),
    sharing_commitment: String(r.sharing_commitment ?? ""),
    train_commitment: String(r.train_commitment ?? ""),
    finalized_at: r.finalized_at ? String(r.finalized_at) : null,
  };
}

export async function getThirdsParticipationStats(): Promise<
  { error: string } | ThirdsParticipationStats
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: settings, error: settingsErr } = await supabase
    .from("thirds_participation_settings")
    .select("participation_started_on")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settingsErr) return { error: settingsErr.message };

  if (!settings?.participation_started_on) {
    const { count: completions, error: compErr } = await supabase
      .from("thirds_personal_group_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (compErr) return { error: compErr.message };
    return {
      hasSettings: false,
      participationStartedOn: null,
      participatedWeeks: 0,
      totalWeeks: 0,
      percent: null,
      informalGroupsCompleted: completions ?? 0,
    };
  }

  const startMonday = utcDateYmd(
    startOfUtcWeekMonday(new Date(`${settings.participation_started_on}T12:00:00.000Z`))
  );

  const metrics = await fetchThirdsParticipationMetrics(supabase, user.id, startMonday);
  if (!metrics) {
    return { error: "Could not load participation weeks." };
  }

  const { participatedWeeks, totalWeeks, ratio } = metrics;
  const percent =
    totalWeeks > 0 ? Math.min(100, Math.round(ratio * 100)) : null;

  const { count: completions, error: compErr2 } = await supabase
    .from("thirds_personal_group_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (compErr2) return { error: compErr2.message };

  return {
    hasSettings: true,
    participationStartedOn: startMonday,
    participatedWeeks,
    totalWeeks,
    percent,
    informalGroupsCompleted: completions ?? 0,
  };
}

export async function setThirdsParticipationStartedOn(
  ymd: string
): Promise<{ error: string } | { success: true; normalizedStartMonday: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return { error: "Invalid date." };

  const normalizedStartMonday = utcDateYmd(
    startOfUtcWeekMonday(new Date(`${ymd}T12:00:00.000Z`))
  );

  const { error } = await supabase.from("thirds_participation_settings").upsert(
    {
      user_id: user.id,
      participation_started_on: normalizedStartMonday,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/personal-thirds");
  return { success: true as const, normalizedStartMonday };
}

export async function getThirdsPersonalWorkspace(): Promise<
  { error: string } | ThirdsPersonalWorkspacePayload
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();

  let { data: row, error: fetchErr } = await supabase
    .from("thirds_personal_weeks")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };

  if (!row) {
    const ins = await supabase
      .from("thirds_personal_weeks")
      .insert({
        user_id: user.id,
        week_start_monday: currentWeekMondayYmd,
      })
      .select("*")
      .single();
    if (ins.error) return { error: ins.error.message };
    row = ins.data;
  }

  const week = rowToDto(row as Record<string, unknown>);
  const priorFinalized = await fetchPriorFinalizedWeek(supabase, user.id, currentWeekMondayYmd);
  const suggestedLookForward = buildSuggestedLookForward(week, priorFinalized);

  let bookForPassage = week.look_up_book?.trim() ?? "";
  let passageChapter = week.look_up_chapter;
  let passageVs = week.look_up_verse_start;
  let passageVe = week.look_up_verse_end;

  if (
    (!bookForPassage ||
      passageChapter == null ||
      passageVs == null ||
      passageVe == null) &&
    week.look_up_preset_story_id
  ) {
    const { data: ps } = await supabase
      .from("preset_stories")
      .select("book, chapter, verse_start, verse_end")
      .eq("id", week.look_up_preset_story_id)
      .maybeSingle();
    if (ps) {
      bookForPassage = String(ps.book ?? "").trim();
      passageChapter = typeof ps.chapter === "number" ? ps.chapter : null;
      passageVs = typeof ps.verse_start === "number" ? ps.verse_start : null;
      passageVe = typeof ps.verse_end === "number" ? ps.verse_end : null;
    }
  }

  let initialPassageVerses: { verse: number; text: string }[] = [];
  if (
    bookForPassage &&
    passageChapter != null &&
    passageVs != null &&
    passageVe != null
  ) {
    const chapterData = await getChapter(bookForPassage, passageChapter);
    if (chapterData) {
      initialPassageVerses = sliceChapterByVerseRange(
        chapterData,
        passageVs,
        passageVe
      );
    }
  }

  return {
    week,
    currentWeekMondayYmd,
    priorFinalized,
    suggestedLookForward,
    initialPassageVerses,
  };
}

export async function saveThirdsPersonalLookBack(input: {
  priorObedienceDone: boolean;
  priorSharingDone: boolean;
  priorTrainDone: boolean;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();
  const { data: existing, error: exErr } = await supabase
    .from("thirds_personal_weeks")
    .select("id, finalized_at")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!existing) return { error: "Week not found." };
  if (existing.finalized_at) return { error: "This week is already finalized." };

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      prior_obedience_done: input.priorObedienceDone,
      prior_sharing_done: input.priorSharingDone,
      prior_train_done: input.priorTrainDone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/groups/personal-thirds");
  revalidatePath("/app/groups");
  return { success: true as const };
}

export async function saveThirdsPersonalLookUp(input: {
  passageMode: "preset" | "manual" | "reference_only";
  presetStoryId?: string | null;
  book?: string;
  chapter?: number | null;
  verseStart?: number | null;
  verseEnd?: number | null;
  passageRef: string;
  observationLike: string;
  observationDifficult: string;
  observationTeachesPeople: string;
  observationTeachesGod: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();
  const { data: existing, error: exErr } = await supabase
    .from("thirds_personal_weeks")
    .select("id, finalized_at")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!existing) return { error: "Week not found." };
  if (existing.finalized_at) return { error: "This week is already finalized." };

  type PassageCols = {
    passage_ref: string;
    look_up_preset_story_id: string | null;
    look_up_book: string;
    look_up_chapter: number | null;
    look_up_verse_start: number | null;
    look_up_verse_end: number | null;
  };

  let passageCols: PassageCols;

  if (input.passageMode === "reference_only") {
    passageCols = {
      passage_ref: input.passageRef.trim().slice(0, 500),
      look_up_preset_story_id: null,
      look_up_book: "",
      look_up_chapter: null,
      look_up_verse_start: null,
      look_up_verse_end: null,
    };
  } else if (input.passageMode === "preset") {
    const pid = input.presetStoryId?.trim();
    if (!pid) return { error: "Select a preset story." };
    const { data: ps, error: pErr } = await supabase
      .from("preset_stories")
      .select("book, chapter, verse_start, verse_end")
      .eq("id", pid)
      .maybeSingle();
    if (pErr || !ps) return { error: "Invalid preset story." };
    const ref =
      input.passageRef.trim() ||
      formatThirdsPersonalPassageRef(
        ps.book,
        ps.chapter,
        ps.verse_start,
        ps.verse_end
      );
    passageCols = {
      passage_ref: ref.slice(0, 500),
      look_up_preset_story_id: pid,
      look_up_book: ps.book,
      look_up_chapter: ps.chapter,
      look_up_verse_start: ps.verse_start,
      look_up_verse_end: ps.verse_end,
    };
  } else {
    const book = (input.book ?? "").trim();
    const ch = input.chapter;
    let vs = input.verseStart;
    let ve = input.verseEnd;
    if (!book || ch == null || vs == null || ve == null) {
      return { error: "Fill in book, chapter, and verse range for a custom passage." };
    }
    if (!Number.isFinite(ch) || ch < 1 || !Number.isFinite(vs) || vs < 1 || !Number.isFinite(ve) || ve < 1) {
      return { error: "Chapter and verses must be positive numbers." };
    }
    if (vs > ve) {
      const t = vs;
      vs = ve;
      ve = t;
    }
    const ref =
      input.passageRef.trim() ||
      formatThirdsPersonalPassageRef(book, Math.floor(ch), Math.floor(vs), Math.floor(ve));
    passageCols = {
      passage_ref: ref.slice(0, 500),
      look_up_preset_story_id: null,
      look_up_book: book,
      look_up_chapter: Math.floor(ch),
      look_up_verse_start: Math.floor(vs),
      look_up_verse_end: Math.floor(ve),
    };
  }

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      ...passageCols,
      observation_like: input.observationLike.trim().slice(0, 4000),
      observation_difficult: input.observationDifficult.trim().slice(0, 4000),
      observation_teaches_people: input.observationTeachesPeople.trim().slice(0, 4000),
      observation_teaches_god: input.observationTeachesGod.trim().slice(0, 4000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/groups/personal-thirds");
  revalidatePath("/app/groups");
  return { success: true as const };
}

export async function saveThirdsPersonalLookForward(input: {
  obedienceStatement: string;
  sharingCommitment: string;
  trainCommitment: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();
  const { data: existing, error: exErr } = await supabase
    .from("thirds_personal_weeks")
    .select("id, finalized_at")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!existing) return { error: "Week not found." };
  if (existing.finalized_at) return { error: "This week is already finalized." };

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      obedience_statement: input.obedienceStatement.trim().slice(0, 4000),
      sharing_commitment: input.sharingCommitment.trim().slice(0, 4000),
      train_commitment: input.trainCommitment.trim().slice(0, 4000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/groups/personal-thirds");
  revalidatePath("/app/groups");
  return { success: true as const };
}

export async function finalizeThirdsPersonalWeek(): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();
  const { data: row, error: exErr } = await supabase
    .from("thirds_personal_weeks")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!row) return { error: "Week not found." };
  if (row.finalized_at) return { error: "Already finalized." };

  const passage = String(row.passage_ref ?? "").trim();
  const like = String(row.observation_like ?? "").trim();
  const diff = String(row.observation_difficult ?? "").trim();
  const ppl = String(row.observation_teaches_people ?? "").trim();
  const god = String(row.observation_teaches_god ?? "").trim();
  const o = String(row.obedience_statement ?? "").trim();
  const s = String(row.sharing_commitment ?? "").trim();
  const t = String(row.train_commitment ?? "").trim();

  if (!passage) return { error: "Look Up: add a passage reference before finalizing." };
  if (!like || !diff || !ppl || !god) {
    return { error: "Look Up: fill in all four observation prompts before finalizing." };
  }
  if (!o || !s || !t) {
    return { error: "Look Forward: obey, share, and train commitments are required." };
  }

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/groups/personal-thirds");
  revalidatePath("/app/groups");
  return { success: true as const };
}

export async function recordThirdsPersonalGroupComplete(): Promise<
  { error: string } | { success: true }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("thirds_personal_group_completions").insert({
    user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/personal-thirds");
  return { success: true as const };
}
