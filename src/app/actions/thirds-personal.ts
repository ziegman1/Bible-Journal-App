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
  SoloLookUpMode,
  ThirdsParticipationStats,
  ThirdsPersonalDbsObservationDTO,
  ThirdsPersonalDbsObservationType,
  ThirdsPersonalWeekDTO,
  ThirdsPersonalWorkspacePayload,
} from "@/lib/groups/thirds-personal-types";
import {
  getDbsDiscoveryFinalizeError,
  validateDbsVerseInPassage,
  validatePersonalThirdsFinalizePayload,
} from "@/lib/groups/thirds-personal-dbs-validate";
import { parseSoloScriptureReference } from "@/lib/groups/solo-scripture-reference-parse";
import { upsertThirdsPillarWeekCompletion } from "@/app/actions/pillar-third-completion";
import { pillarWeekStartKeyFromInstant } from "@/lib/dashboard/pillar-week";
import { getPracticeTimeZone } from "@/lib/timezone/get-practice-timezone";
import { createClient } from "@/lib/supabase/server";

function revalidatePersonalThirdsSurface() {
  revalidatePath("/app/groups/personal-thirds");
  revalidatePath("/app/groups/personal-thirds/practice");
}

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

/**
 * Effective Look Up mode: explicit preference wins; with no row, prefer devotional only when
 * the user already has free-form observation text and no DBS rows (legacy devotional weeks).
 */
function resolveEffectiveSoloLookUpMode(
  prefMode: string | null | undefined,
  week: ThirdsPersonalWeekDTO,
  dbsObservationCount: number
): SoloLookUpMode {
  if (prefMode === "devotional") return "devotional";
  if (prefMode === "dbs") return "dbs";
  const hasDevotional =
    week.observation_like.trim().length > 0 ||
    week.observation_difficult.trim().length > 0 ||
    week.observation_teaches_people.trim().length > 0 ||
    week.observation_teaches_god.trim().length > 0;
  if (hasDevotional && dbsObservationCount === 0) return "devotional";
  return "dbs";
}

function rowToDto(r: Record<string, unknown>): ThirdsPersonalWeekDTO {
  return {
    id: String(r.id),
    week_start_monday: String(r.week_start_monday),
    prior_obedience_done: Boolean(r.prior_obedience_done),
    prior_sharing_done: Boolean(r.prior_sharing_done),
    prior_train_done: Boolean(r.prior_train_done),
    look_back_share_care: String(r.look_back_share_care ?? ""),
    look_back_vision_reflection: String(r.look_back_vision_reflection ?? ""),
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
    completed_look_up_mode:
      r.completed_look_up_mode === "dbs" || r.completed_look_up_mode === "devotional"
        ? r.completed_look_up_mode
        : null,
  };
}

function observationRowToDto(
  row: Record<string, unknown>,
  personalWeekId: string
): ThirdsPersonalDbsObservationDTO {
  return {
    id: String(row.id),
    personal_week_id: personalWeekId,
    observation_type: row.observation_type as ThirdsPersonalDbsObservationType,
    book: String(row.book ?? ""),
    chapter: Number(row.chapter ?? 0),
    verse_number: Number(row.verse_number ?? 0),
    verse_end:
      row.verse_end == null || row.verse_end === ""
        ? null
        : Number(row.verse_end),
    note: String(row.note ?? ""),
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

  const { count: completions, error: compErr } = await supabase
    .from("thirds_personal_group_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (compErr) return { error: compErr.message };

  const metrics = await fetchThirdsParticipationMetrics(supabase, user.id);
  if (!metrics) {
    if (!settings?.participation_started_on) {
      return {
        hasSettings: false,
        participationStartedOn: null,
        participatedWeeks: 0,
        totalWeeks: 0,
        percent: null,
        informalGroupsCompleted: completions ?? 0,
      };
    }
    return { error: "Could not load participation weeks." };
  }

  const { participatedWeeks, totalWeeks, ratio } = metrics;
  const percent =
    totalWeeks > 0 ? Math.min(100, Math.round(ratio * 100)) : null;

  if (!settings?.participation_started_on) {
    return {
      hasSettings: false,
      participationStartedOn: null,
      participatedWeeks,
      totalWeeks,
      percent,
      informalGroupsCompleted: completions ?? 0,
    };
  }

  const startMonday = utcDateYmd(
    startOfUtcWeekMonday(new Date(`${settings.participation_started_on}T12:00:00.000Z`))
  );

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
  revalidatePath("/app/groups/progress");
  revalidatePersonalThirdsSurface();
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

  const { data: prefRow } = await supabase
    .from("thirds_solo_user_preferences")
    .select("solo_look_up_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: obsRows, error: obsErr } = await supabase
    .from("thirds_personal_observations")
    .select("id, personal_week_id, observation_type, book, chapter, verse_number, verse_end, note")
    .eq("personal_week_id", week.id);

  if (obsErr) return { error: obsErr.message };

  const dbsObservations: ThirdsPersonalDbsObservationDTO[] = (obsRows ?? []).map((o) =>
    observationRowToDto(o as Record<string, unknown>, week.id)
  );

  const soloLookUpMode = resolveEffectiveSoloLookUpMode(
    prefRow?.solo_look_up_mode as string | undefined,
    week,
    dbsObservations.length
  );

  return {
    week,
    currentWeekMondayYmd,
    priorFinalized,
    suggestedLookForward,
    soloLookUpMode,
    dbsObservations,
  };
}

export async function setThirdsSoloLookUpPreference(
  mode: SoloLookUpMode
): Promise<{ error: string } | { success: true }> {
  if (mode !== "devotional" && mode !== "dbs") {
    return { error: "Invalid mode." };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("thirds_solo_user_preferences").upsert(
    {
      user_id: user.id,
      solo_look_up_mode: mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  return { success: true as const };
}

/** Persist passage reference only (DBS path — does not touch devotional observation columns). */
export async function saveThirdsPersonalPassageRef(input: {
  scriptureReference: string;
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
  if (!ref) return { error: "Enter a scripture passage." };
  const parsedRef = parseSoloScriptureReference(ref);
  if (!parsedRef.ok) return { error: parsedRef.message };

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      passage_ref: ref,
      look_up_preset_story_id: null,
      look_up_book: "",
      look_up_chapter: null,
      look_up_verse_start: null,
      look_up_verse_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
  return { success: true as const };
}

export async function saveThirdsPersonalDbsObservation(input: {
  observationType: ThirdsPersonalDbsObservationType;
  book: string;
  chapter: number;
  verseNumber: number;
  verseEnd: number | null;
  note: string;
}): Promise<{ error: string } | { success: true; dbsLookUpDiscoveryComplete: boolean }> {
  const allowed: ThirdsPersonalDbsObservationType[] = [
    "like",
    "difficult",
    "teaches_about_people",
    "teaches_about_god",
  ];
  if (!allowed.includes(input.observationType)) {
    return { error: "Invalid observation type." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const currentWeekMondayYmd = currentUtcWeekMondayYmd();
  const { data: weekRow, error: wErr } = await supabase
    .from("thirds_personal_weeks")
    .select("id, finalized_at, passage_ref")
    .eq("user_id", user.id)
    .eq("week_start_monday", currentWeekMondayYmd)
    .maybeSingle();

  if (wErr) return { error: wErr.message };
  if (!weekRow) return { error: "Week not found." };
  if (weekRow.finalized_at) return { error: "This week is already finalized." };

  const passageRef = String(weekRow.passage_ref ?? "").trim();
  if (!passageRef) return { error: "Save your passage reference before observations." };

  const note = input.note.trim().slice(0, 4000);
  if (!note) return { error: "Write your observation before saving." };

  const vStart = Math.floor(Number(input.verseNumber));
  if (!Number.isFinite(vStart) || vStart < 1) {
    return { error: "Choose a valid start verse." };
  }
  let vEnd: number | null = null;
  if (input.verseEnd != null && Number.isFinite(Number(input.verseEnd))) {
    const e = Math.floor(Number(input.verseEnd));
    vEnd = e !== vStart ? e : null;
  }
  if (vEnd != null && vEnd < vStart) {
    return { error: "End verse must be the same as or after the start verse." };
  }

  const ch = Math.floor(Number(input.chapter));
  if (!Number.isFinite(ch) || ch < 1) return { error: "Invalid chapter." };

  const verseErr = validateDbsVerseInPassage(
    passageRef,
    input.book,
    ch,
    vStart,
    vEnd
  );
  if (verseErr) return { error: verseErr };

  const { data: existingObs, error: findErr } = await supabase
    .from("thirds_personal_observations")
    .select("id")
    .eq("personal_week_id", weekRow.id)
    .eq("observation_type", input.observationType)
    .maybeSingle();

  if (findErr) return { error: findErr.message };

  const payload = {
    personal_week_id: weekRow.id,
    user_id: user.id,
    observation_type: input.observationType,
    book: input.book.trim(),
    chapter: ch,
    verse_number: vStart,
    verse_end: vEnd,
    note,
    updated_at: new Date().toISOString(),
  };

  if (existingObs?.id) {
    const { error } = await supabase
      .from("thirds_personal_observations")
      .update(payload)
      .eq("id", existingObs.id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("thirds_personal_observations").insert(payload);
    if (error) return { error: error.message };
  }
  const { data: obsAfter, error: afterErr } = await supabase
    .from("thirds_personal_observations")
    .select("observation_type, note, verse_number, verse_end, book, chapter")
    .eq("personal_week_id", weekRow.id);

  if (afterErr) {
    return { success: true as const, dbsLookUpDiscoveryComplete: false };
  }

  const dbsLookUpDiscoveryComplete = getDbsDiscoveryFinalizeError(passageRef, obsAfter ?? []) === null;

  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
  return { success: true as const, dbsLookUpDiscoveryComplete };
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
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
  return { success: true as const };
}

const LOOK_BACK_JOURNAL_MAX = 4000;

export async function saveThirdsPersonalLookBackJournal(input: {
  shareCareNotes?: string;
  visionReflectionNotes?: string;
}): Promise<{ error: string } | { success: true }> {
  if (input.shareCareNotes === undefined && input.visionReflectionNotes === undefined) {
    return { error: "Nothing to save." };
  }
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

  const patch: Record<string, string | unknown> = { updated_at: new Date().toISOString() };
  if (input.shareCareNotes !== undefined) {
    patch.look_back_share_care = input.shareCareNotes.trim().slice(0, LOOK_BACK_JOURNAL_MAX);
  }
  if (input.visionReflectionNotes !== undefined) {
    patch.look_back_vision_reflection = input.visionReflectionNotes.trim().slice(0, LOOK_BACK_JOURNAL_MAX);
  }

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update(patch)
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
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
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
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
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
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

  const { data: prefRow } = await supabase
    .from("thirds_solo_user_preferences")
    .select("solo_look_up_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  const dto = rowToDto(row as Record<string, unknown>);

  const { data: obsList, error: obsErr } = await supabase
    .from("thirds_personal_observations")
    .select("observation_type, note, verse_number, verse_end, book, chapter")
    .eq("personal_week_id", row.id);

  if (obsErr) return { error: obsErr.message };

  const lookUpMode = resolveEffectiveSoloLookUpMode(
    prefRow?.solo_look_up_mode as string | undefined,
    dto,
    obsList?.length ?? 0
  );

  const dbsObservationsForValidate: ThirdsPersonalDbsObservationDTO[] = (obsList ?? []).map((o, idx) => ({
    id: `validate-${idx}`,
    personal_week_id: String(row.id),
    observation_type: o.observation_type as ThirdsPersonalDbsObservationType,
    book: String((o as { book?: string }).book ?? ""),
    chapter: Number((o as { chapter?: number }).chapter ?? 0),
    verse_number: Number(o.verse_number ?? 0),
    verse_end:
      (o as { verse_end?: unknown }).verse_end == null || (o as { verse_end?: unknown }).verse_end === ""
        ? null
        : Number((o as { verse_end?: unknown }).verse_end),
    note: String((o as { note?: string }).note ?? ""),
  }));

  const finalizeCheckPayload: ThirdsPersonalWorkspacePayload = {
    week: dto,
    currentWeekMondayYmd,
    priorFinalized: null,
    suggestedLookForward: buildSuggestedLookForward(dto, null),
    soloLookUpMode: lookUpMode,
    dbsObservations: dbsObservationsForValidate,
  };

  const finalizeErr = validatePersonalThirdsFinalizePayload(finalizeCheckPayload, lookUpMode);
  if (finalizeErr) return { error: finalizeErr };

  const completedLookUpMode: SoloLookUpMode = lookUpMode === "dbs" ? "dbs" : "devotional";

  const { error } = await supabase
    .from("thirds_personal_weeks")
    .update({
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_look_up_mode: completedLookUpMode,
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
  revalidatePersonalThirdsSurface();
  revalidatePath("/app/groups");
  revalidatePath("/app/groups/progress");
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
  revalidatePath("/app/groups/progress");
  revalidatePersonalThirdsSurface();
  return { success: true as const };
}
