"use server";

import { revalidatePath } from "next/cache";
import { startOfUtcWeekMonday, utcDateYmd } from "@/lib/dashboard/utc-week";
import { fetchThirdsParticipationMetrics } from "@/lib/groups/thirds-participation-metrics";
import {
  buildSuggestedLookForward,
  currentUtcWeekMondayYmd,
  effectiveThirdsPersonalPassageRef,
  type PriorFinalizedCommitments,
} from "@/lib/groups/thirds-personal-helpers";
import type {
  ThirdsParticipationStats,
  ThirdsPersonalWeekDTO,
  ThirdsPersonalWorkspacePayload,
} from "@/lib/groups/thirds-personal-types";
import { upsertThirdsPillarWeekCompletion } from "@/app/actions/pillar-third-completion";
import { pillarWeekStartKeyFromInstant } from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { createClient } from "@/lib/supabase/server";

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

  const { data: fetchedRow, error: fetchErr } = await supabase
    .from("thirds_personal_weeks")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };

  let row = fetchedRow;

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

  return {
    week,
    currentWeekMondayYmd,
    priorFinalized,
    suggestedLookForward,
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
  scriptureReference: string;
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

  const ref = input.scriptureReference.trim().slice(0, 500);
  if (!ref) {
    return { error: "Enter a scripture passage." };
  }

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      passage_ref: ref,
      look_up_preset_story_id: null,
      look_up_book: "",
      look_up_chapter: null,
      look_up_verse_start: null,
      look_up_verse_end: null,
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

  const passage = effectiveThirdsPersonalPassageRef(rowToDto(row as Record<string, unknown>));
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

  const tz = await getPracticeTimeZone();
  const pillarWeek = pillarWeekStartKeyFromInstant(new Date(), tz);
  void (await upsertThirdsPillarWeekCompletion({
    pillarWeekStartYmd: pillarWeek,
    source: "solo_finalize",
  }));

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

  const tz2 = await getPracticeTimeZone();
  const pillarWeek2 = pillarWeekStartKeyFromInstant(new Date(), tz2);
  void (await upsertThirdsPillarWeekCompletion({
    pillarWeekStartYmd: pillarWeek2,
    source: "informal_group",
  }));

  revalidatePath("/app");
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/personal-thirds");
  return { success: true as const };
}
