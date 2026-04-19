"use server";

import { revalidatePath } from "next/cache";
import {
  normalizeListDisplayName,
  normalizeListKey,
  parseImportBulk,
  type ParsedImportLine,
} from "@/lib/scripture-module/import-parse";
import {
  addDays,
  addDaysIso,
  nextHoldAfterReview,
  type HoldOutcome,
} from "@/lib/scripture-module/hold-schedule";
import {
  applyMemorizeRound,
  applyReviewRound,
  ladderStepToMemorizeStage,
  memorizeProgressForLadderJump,
  parseMemorizeProgress,
  type MemorizeLadderStepNumber,
} from "@/lib/scripture-module/memorize-engine";
import { referenceToTypingToken } from "@/lib/scripture-module/reference-typing-token";
import {
  addDaysIsoFromNow,
  daysForReviewIntervalIndex,
  isValidManualReviewIntervalDay,
} from "@/lib/scripture-module/review-interval-schedule";
import { segmentVerseIntoPhrases } from "@/lib/scripture-module/phrase-segment";
import {
  getEmailForScriptureAccess,
  isScriptureModuleOperatorEmail,
} from "@/lib/scripture-module/access";
import { INITIAL_REVIEW_STAGE } from "@/lib/scripture-module/review-stage-progression";
import { memorizationStageShortLabel } from "@/lib/scripture-module/stage-labels";
import {
  mapGripMemoryRow,
  mapScriptureItemRow,
  type GripMemoryDTO,
  type MemorizeStage,
  type MyVerseQueueRowDTO,
  type MyVerseQueueStatus,
  type ReviewStage,
  type ScriptureItemDTO,
  type ScriptureItemMemoryRowDb,
  type ScriptureItemRowDb,
} from "@/lib/scripture-module/types";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Columns for `scripture_item_memory` reads/writes in this module. */
const MEMORY_ROW_SELECT =
  "id, user_id, scripture_item_id, grip_status, memorize_stage, memorize_progress, memorize_paraphrase, memorize_meaning, phrase_segments, supported_recall_completed_at, full_recall_completed_at, grasp_paraphrase, grasp_completed_at, recall_completed_at, say_completed_at, completed_at, last_started_at, last_step_at, review_stage, review_progress, review_interval_index, review_interval_override_days, hold_status, hold_next_review_at, hold_last_reviewed_at, hold_review_count, hold_last_outcome, created_at, updated_at";

type ScriptureOperatorOk = { supabase: SupabaseClient; user: User };

async function requireScriptureOperator(): Promise<
  { error: string } | ScriptureOperatorOk
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!isScriptureModuleOperatorEmail(getEmailForScriptureAccess(user))) {
    return { error: "Not available" };
  }
  return { supabase, user };
}

function revalidateScriptureModule(itemId?: string) {
  revalidatePath("/scripture");
  revalidatePath("/scripture/lists");
  revalidatePath("/scripture/my-verses");
  revalidatePath("/scripture/memorize");
  revalidatePath("/scripture/settings");
  revalidatePath("/scripture/review");
  if (itemId) {
    revalidatePath(`/scripture/items/${itemId}`);
    revalidatePath(`/scripture/items/${itemId}/memorize`);
    revalidatePath(`/scripture/items/${itemId}/meditate`);
    revalidatePath(`/scripture/items/${itemId}/review`);
  }
}

function isMemoryMasteredForQueue(mem: GripMemoryDTO): boolean {
  return mem.memorizeStage === "completed" || mem.gripStatus === "completed";
}

function deriveMyVerseStatusFromMemory(mem: GripMemoryDTO): MyVerseQueueStatus {
  if (isMemoryMasteredForQueue(mem)) return "mastered";
  const hasPhrases = (mem.phraseSegments?.length ?? 0) > 0;
  const hasContextWork = Boolean(mem.memorizeParaphrase?.trim());
  if (!hasPhrases && !hasContextWork && mem.memorizeStage === "context") {
    return "not_started";
  }
  return "in_progress";
}

function passagePreviewFromText(text: string, maxLen = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

async function syncMyVerseRowFromMemory(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<void> {
  const { data: mv, error: e1 } = await supabase
    .from("scripture_my_verses")
    .select("id, mastered_at")
    .eq("user_id", userId)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (e1 || !mv) return;

  const { data: raw, error: e2 } = await supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", userId)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (e2 || !raw) return;

  const mem = mapGripMemoryRow(raw as ScriptureItemMemoryRowDb);
  const status = deriveMyVerseStatusFromMemory(mem);
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    current_stage: mem.memorizeStage,
    updated_at: nowIso,
  };
  if (status === "mastered") {
    const prev = mv as { mastered_at: string | null };
    patch.mastered_at = prev.mastered_at ?? nowIso;
  }

  await supabase.from("scripture_my_verses").update(patch).eq("id", mv.id).eq("user_id", userId);
}

/** Same phrase source as `getScriptureReviewPageData`: saved phrases or verse segmentation. */
function phraseSegmentsForReview(mem: GripMemoryDTO, verseText: string): string[] {
  const fromMem = mem.phraseSegments;
  if (fromMem && fromMem.length > 0) return fromMem;
  return segmentVerseIntoPhrases(verseText);
}

async function getFirstIncompleteMyVerseItemId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: rows, error } = await supabase
    .from("scripture_my_verses")
    .select("scripture_item_id")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error || !rows?.length) return null;

  const ids = rows.map((r) => r.scripture_item_id as string);
  const { data: memRows } = await supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", userId)
    .in("scripture_item_id", ids);

  const memById = new Map<string, ScriptureItemMemoryRowDb>();
  for (const m of memRows ?? []) {
    memById.set(m.scripture_item_id as string, m as ScriptureItemMemoryRowDb);
  }

  for (const id of ids) {
    const row = memById.get(id);
    if (!row) return id;
    const mem = mapGripMemoryRow(row);
    if (!isMemoryMasteredForQueue(mem)) return id;
  }
  return null;
}

/** Lazy seed for rows completed before HOLD migration or partial writes. */
async function ensureHoldSeededForRow(
  supabase: SupabaseClient,
  userId: string,
  row: ScriptureItemMemoryRowDb
): Promise<ScriptureItemMemoryRowDb> {
  if (row.grip_status !== "completed") return row;

  const needsHoldSeed = row.hold_status == null || row.hold_next_review_at == null;
  const needsReviewSeed = row.review_stage == null;

  if (!needsHoldSeed && !needsReviewSeed) return row;

  const base = row.completed_at ? new Date(row.completed_at) : new Date();
  const nextAt = needsHoldSeed ? addDaysIso(base, 1) : row.hold_next_review_at!;

  const patch: Record<string, unknown> = {};
  if (needsHoldSeed) {
    patch.hold_status = "fresh";
    patch.hold_next_review_at = nextAt;
  }
  if (needsReviewSeed) {
    patch.review_stage = "stage_4";
    if (row.review_interval_index == null) patch.review_interval_index = 0;
  }

  const { data, error } = await supabase
    .from("scripture_item_memory")
    .update(patch)
    .eq("id", row.id)
    .eq("user_id", userId)
    .select(MEMORY_ROW_SELECT)
    .single();

  if (error || !data) return row;
  return data as ScriptureItemMemoryRowDb;
}

export async function getScriptureHomeOverview(): Promise<
  | { error: string }
  | {
      totalVerses: number;
      totalLists: number;
      gripNotStarted: number;
      gripInProgress: number;
      gripCompleted: number;
      holdReviewsDue: number;
      holdEstablished: number;
      recent: ScriptureItemDTO[];
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const nowIso = new Date().toISOString();

  const [countItems, countLists, recentRes, memAll, memDone, holdDue, holdEst] = await Promise.all([
    r.supabase
      .from("scripture_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id),
    r.supabase
      .from("scripture_lists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id),
    r.supabase
      .from("scripture_items")
      .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
      .eq("user_id", r.user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    r.supabase
      .from("scripture_item_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id),
    r.supabase
      .from("scripture_item_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id)
      .eq("grip_status", "completed"),
    r.supabase
      .from("scripture_item_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id)
      .eq("grip_status", "completed")
      .not("hold_status", "is", null)
      .lte("hold_next_review_at", nowIso),
    r.supabase
      .from("scripture_item_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", r.user.id)
      .eq("hold_status", "established"),
  ]);

  if (countItems.error) return { error: countItems.error.message };
  if (countLists.error) return { error: countLists.error.message };
  if (recentRes.error) return { error: recentRes.error.message };
  if (memAll.error) return { error: memAll.error.message };
  if (memDone.error) return { error: memDone.error.message };
  if (holdDue.error) return { error: holdDue.error.message };
  if (holdEst.error) return { error: holdEst.error.message };

  const totalVerses = countItems.count ?? 0;
  const withMemory = memAll.count ?? 0;
  const gripCompleted = memDone.count ?? 0;
  const gripInProgress = Math.max(0, withMemory - gripCompleted);
  const gripNotStarted = Math.max(0, totalVerses - withMemory);

  return {
    totalVerses,
    totalLists: countLists.count ?? 0,
    gripNotStarted,
    gripInProgress,
    gripCompleted,
    holdReviewsDue: holdDue.count ?? 0,
    holdEstablished: holdEst.count ?? 0,
    recent: (recentRes.data ?? []).map((row) => mapScriptureItemRow(row as ScriptureItemRowDb)),
  };
}

export async function getScriptureListsForUser(): Promise<
  { error: string } | { lists: { id: string; name: string }[] }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data, error } = await r.supabase
    .from("scripture_lists")
    .select("id, name")
    .eq("user_id", r.user.id)
    .order("name", { ascending: true });

  if (error) return { error: error.message };
  return { lists: data ?? [] };
}

export async function getScriptureItemDetail(
  itemId: string
): Promise<
  | { error: string }
  | {
      item: ScriptureItemDTO;
      listIds: string[];
      lists: { id: string; name: string }[];
      memory: GripMemoryDTO | null;
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: item, error: itemErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr) return { error: itemErr.message };
  if (!item) return { error: "Verse not found." };

  const { data: memRaw, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();

  if (mErr) return { error: mErr.message };

  const memRow = memRaw
    ? await ensureHoldSeededForRow(r.supabase, r.user.id, memRaw as ScriptureItemMemoryRowDb)
    : null;

  const { data: joins, error: jErr } = await r.supabase
    .from("scripture_item_lists")
    .select("scripture_list_id")
    .eq("scripture_item_id", itemId);

  if (jErr) return { error: jErr.message };

  const listIds = (joins ?? []).map((j) => j.scripture_list_id);

  let lists: { id: string; name: string }[] = [];
  if (listIds.length > 0) {
    const { data: listRows, error: lrErr } = await r.supabase
      .from("scripture_lists")
      .select("id, name")
      .eq("user_id", r.user.id)
      .in("id", listIds);
    if (lrErr) return { error: lrErr.message };
    lists = listRows ?? [];
  }

  return {
    item: mapScriptureItemRow(item as ScriptureItemRowDb),
    listIds,
    lists,
    memory: memRow ? mapGripMemoryRow(memRow as ScriptureItemMemoryRowDb) : null,
  };
}

export async function getScriptureListsOverview(): Promise<
  | { error: string }
  | {
      lists: {
        id: string;
        name: string;
        description: string | null;
        verseCount: number;
        updatedAt: string;
      }[];
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: lists, error } = await r.supabase
    .from("scripture_lists")
    .select("id, name, description, updated_at")
    .eq("user_id", r.user.id)
    .order("name", { ascending: true });

  if (error) return { error: error.message };

  const ids = (lists ?? []).map((l) => l.id);
  if (ids.length === 0) {
    return { lists: [] };
  }

  const { data: counts, error: cErr } = await r.supabase
    .from("scripture_item_lists")
    .select("scripture_list_id")
    .in("scripture_list_id", ids);

  if (cErr) return { error: cErr.message };

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = row.scripture_list_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return {
    lists: (lists ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      verseCount: countMap.get(l.id) ?? 0,
      updatedAt: l.updated_at,
    })),
  };
}

export type ScriptureListItemWithStatus = {
  item: ScriptureItemDTO;
  grip: "not_started" | "in_progress" | "completed";
  holdStatus: string | null;
  holdNextReviewAt: string | null;
  reviewIntervalOverrideDays: number | null;
  reviewDue: boolean;
  inMyVerses: boolean;
};

export async function getScriptureListDetail(listId: string): Promise<
  | { error: string }
  | {
      list: { id: string; name: string; description: string | null; updatedAt: string };
      items: ScriptureListItemWithStatus[];
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: list, error: lErr } = await r.supabase
    .from("scripture_lists")
    .select("id, name, description, updated_at")
    .eq("user_id", r.user.id)
    .eq("id", listId)
    .maybeSingle();

  if (lErr) return { error: lErr.message };
  if (!list) return { error: "List not found." };

  const { data: joins, error: jErr } = await r.supabase
    .from("scripture_item_lists")
    .select("scripture_item_id, created_at")
    .eq("scripture_list_id", listId)
    .order("created_at", { ascending: true });

  if (jErr) return { error: jErr.message };

  const itemIds = (joins ?? []).map((j) => j.scripture_item_id as string);
  if (itemIds.length === 0) {
    return {
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        updatedAt: list.updated_at,
      },
      items: [],
    };
  }

  const { data: items, error: iErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .in("id", itemIds);

  if (iErr) return { error: iErr.message };

  const itemById = new Map((items ?? []).map((row) => [row.id as string, row as ScriptureItemRowDb]));

  const { data: mvRows } = await r.supabase
    .from("scripture_my_verses")
    .select("scripture_item_id")
    .eq("user_id", r.user.id)
    .in("scripture_item_id", itemIds);
  const inMyVersesSet = new Set((mvRows ?? []).map((x) => x.scripture_item_id as string));

  const { data: memRows, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .in("scripture_item_id", itemIds);

  if (mErr) return { error: mErr.message };

  const memById = new Map<string, ScriptureItemMemoryRowDb>();
  for (const row of memRows ?? []) {
    memById.set(row.scripture_item_id as string, row as ScriptureItemMemoryRowDb);
  }

  const now = Date.now();

  const enriched: ScriptureListItemWithStatus[] = itemIds.map((itemId) => {
    const row = itemById.get(itemId);
    if (!row) {
      return null;
    }
    const item = mapScriptureItemRow(row);
    const memRow = memById.get(item.id);
    if (!memRow) {
      return {
        item,
        grip: "not_started" as const,
        holdStatus: null,
        holdNextReviewAt: null,
        reviewIntervalOverrideDays: null,
        reviewDue: false,
        inMyVerses: inMyVersesSet.has(item.id),
      };
    }
    const mem = mapGripMemoryRow(memRow);
    let grip: ScriptureListItemWithStatus["grip"] = "in_progress";
    if (mem.gripStatus === "completed") grip = "completed";
    const holdNext = mem.holdNextReviewAt ? new Date(mem.holdNextReviewAt).getTime() : null;
    const reviewDue =
      grip === "completed" &&
      mem.holdStatus != null &&
      holdNext != null &&
      holdNext <= now;
    return {
      item,
      grip,
      holdStatus: mem.holdStatus,
      holdNextReviewAt: mem.holdNextReviewAt,
      reviewIntervalOverrideDays: mem.reviewIntervalOverrideDays,
      reviewDue,
      inMyVerses: inMyVersesSet.has(item.id),
    };
  }).filter(Boolean) as ScriptureListItemWithStatus[];

  return {
    list: {
      id: list.id,
      name: list.name,
      description: list.description,
      updatedAt: list.updated_at,
    },
    items: enriched,
  };
}

export async function getScriptureListForEdit(listId: string): Promise<
  { error: string } | { name: string; description: string | null }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data, error } = await r.supabase
    .from("scripture_lists")
    .select("name, description")
    .eq("user_id", r.user.id)
    .eq("id", listId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "List not found." };
  return { name: data.name, description: data.description };
}

export async function createScriptureItem(
  formData: FormData
): Promise<{ error: string } | { success: true; id: string }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const reference = String(formData.get("reference") ?? "").trim();
  const translation = String(formData.get("translation") ?? "").trim() || null;
  const verseText = String(formData.get("verseText") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const listIdsRaw = formData.getAll("listIds");
  const listIds = listIdsRaw
    .map((v) => String(v).trim())
    .filter((id) => id.length > 0);

  if (!reference) return { error: "Reference is required." };
  if (!verseText) return { error: "Verse text is required." };

  if (listIds.length > 0) {
    const { data: owned, error: oErr } = await r.supabase
      .from("scripture_lists")
      .select("id")
      .eq("user_id", r.user.id)
      .in("id", listIds);
    if (oErr) return { error: oErr.message };
    if ((owned ?? []).length !== listIds.length) {
      return { error: "One or more lists are invalid." };
    }
  }

  const { data: inserted, error: insErr } = await r.supabase
    .from("scripture_items")
    .insert({
      user_id: r.user.id,
      reference,
      translation,
      verse_text: verseText,
      notes,
      source_type: "manual",
    })
    .select("id")
    .single();

  if (insErr) return { error: insErr.message };
  const id = inserted!.id as string;

  if (listIds.length > 0) {
    const { error: jErr } = await r.supabase.from("scripture_item_lists").insert(
      listIds.map((scripture_list_id) => ({
        scripture_item_id: id,
        scripture_list_id,
      }))
    );
    if (jErr) return { error: jErr.message };
  }

  revalidateScriptureModule();
  revalidatePath(`/scripture/items/${id}`);
  return { success: true, id };
}

export async function updateScriptureItem(
  itemId: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const reference = String(formData.get("reference") ?? "").trim();
  const translation = String(formData.get("translation") ?? "").trim() || null;
  const verseText = String(formData.get("verseText") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const listIdsRaw = formData.getAll("listIds");
  const listIds = listIdsRaw
    .map((v) => String(v).trim())
    .filter((id) => id.length > 0);

  if (!reference) return { error: "Reference is required." };
  if (!verseText) return { error: "Verse text is required." };

  const { data: existing, error: exErr } = await r.supabase
    .from("scripture_items")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("id", itemId)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!existing) return { error: "Verse not found." };

  if (listIds.length > 0) {
    const { data: owned, error: oErr } = await r.supabase
      .from("scripture_lists")
      .select("id")
      .eq("user_id", r.user.id)
      .in("id", listIds);
    if (oErr) return { error: oErr.message };
    if ((owned ?? []).length !== listIds.length) {
      return { error: "One or more lists are invalid." };
    }
  }

  const { error: upErr } = await r.supabase
    .from("scripture_items")
    .update({
      reference,
      translation,
      verse_text: verseText,
      notes,
    })
    .eq("user_id", r.user.id)
    .eq("id", itemId);

  if (upErr) return { error: upErr.message };

  const { error: delErr } = await r.supabase
    .from("scripture_item_lists")
    .delete()
    .eq("scripture_item_id", itemId);

  if (delErr) return { error: delErr.message };

  if (listIds.length > 0) {
    const { error: jErr } = await r.supabase.from("scripture_item_lists").insert(
      listIds.map((scripture_list_id) => ({
        scripture_item_id: itemId,
        scripture_list_id,
      }))
    );
    if (jErr) return { error: jErr.message };
  }

  revalidateScriptureModule();
  revalidatePath(`/scripture/items/${itemId}`);
  return { success: true };
}

export async function createScriptureList(
  formData: FormData
): Promise<{ error: string } | { success: true; id: string }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const name = normalizeListDisplayName(String(formData.get("name") ?? ""));
  const descRaw = String(formData.get("description") ?? "").trim();
  const description = descRaw.length > 0 ? descRaw : null;

  if (!name) return { error: "Name is required." };

  const { data: inserted, error } = await r.supabase
    .from("scripture_lists")
    .insert({
      user_id: r.user.id,
      name,
      description,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A list with this name already exists." };
    }
    return { error: error.message };
  }

  revalidateScriptureModule();
  return { success: true, id: inserted!.id as string };
}

export async function updateScriptureList(
  listId: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const name = normalizeListDisplayName(String(formData.get("name") ?? ""));
  const descRaw = String(formData.get("description") ?? "").trim();
  const description = descRaw.length > 0 ? descRaw : null;

  if (!name) return { error: "Name is required." };

  const { data: existing, error: exErr } = await r.supabase
    .from("scripture_lists")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("id", listId)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (!existing) return { error: "List not found." };

  const { error } = await r.supabase
    .from("scripture_lists")
    .update({ name, description })
    .eq("user_id", r.user.id)
    .eq("id", listId);

  if (error) {
    if (error.code === "23505") {
      return { error: "A list with this name already exists." };
    }
    return { error: error.message };
  }

  revalidateScriptureModule();
  revalidatePath(`/scripture/lists/${listId}`);
  return { success: true };
}

export async function removeVerseFromList(
  listId: string,
  itemId: string
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { error } = await r.supabase
    .from("scripture_item_lists")
    .delete()
    .eq("scripture_list_id", listId)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  revalidateScriptureModule();
  revalidatePath(`/scripture/lists/${listId}`);
  revalidatePath(`/scripture/items/${itemId}`);
  return { success: true };
}

function coerceParsedImportLinesFromJson(raw: unknown): ParsedImportLine[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ParsedImportLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const x = item as Record<string, unknown>;
    const ln = Number(x.lineNumber);
    if (!Number.isFinite(ln) || ln < 0) return null;
    if (x.ok === false) {
      out.push({ ok: false, lineNumber: ln, error: String(x.error ?? "Invalid row") });
    } else if (x.ok === true) {
      out.push({
        ok: true,
        lineNumber: ln,
        reference: String(x.reference ?? ""),
        translation: String(x.translation ?? ""),
        verseText: String(x.verseText ?? ""),
        listName: x.listName == null || x.listName === "" ? null : String(x.listName),
      });
    } else {
      return null;
    }
  }
  return out;
}

async function runScriptureImportForParsedLines(
  r: ScriptureOperatorOk,
  parsed: ParsedImportLine[]
): Promise<
  | { error: string }
  | {
      success: true;
      imported: number;
      failed: { line: number; message: string }[];
    }
> {
  const { supabase, user } = r;
  const failed: { line: number; message: string }[] = [];
  let imported = 0;

  const { data: existingLists, error: lErr } = await supabase
    .from("scripture_lists")
    .select("id, name")
    .eq("user_id", user.id);

  if (lErr) return { error: lErr.message };

  const listByKey = new Map<string, string>();
  for (const row of existingLists ?? []) {
    listByKey.set(normalizeListKey(row.name), row.id);
  }

  async function resolveListId(listName: string): Promise<{ id: string } | { error: string }> {
    const key = normalizeListKey(listName);
    const hit = listByKey.get(key);
    if (hit) return { id: hit };
    const display = normalizeListDisplayName(listName);
    const { data: created, error } = await supabase
      .from("scripture_lists")
      .insert({
        user_id: user.id,
        name: display,
        description: null,
      })
      .select("id")
      .single();
    if (!error && created?.id) {
      listByKey.set(key, created.id);
      return { id: created.id };
    }
    if (error?.code === "23505") {
      const { data: all } = await supabase
        .from("scripture_lists")
        .select("id, name")
        .eq("user_id", user.id);
      for (const row of all ?? []) {
        if (normalizeListKey(row.name) === key) {
          listByKey.set(key, row.id);
          return { id: row.id };
        }
      }
      return { error: "Could not resolve list after duplicate." };
    }
    return { error: error?.message ?? "Could not resolve list." };
  }

  for (const line of parsed) {
    if (!line.ok) {
      failed.push({ line: line.lineNumber, message: line.error });
      continue;
    }
    const { reference, translation, verseText, listName } = line;

    let listId: string | null = null;
    if (listName) {
      const resolved = await resolveListId(listName);
      if ("error" in resolved) {
        failed.push({ line: line.lineNumber, message: resolved.error });
        continue;
      }
      listId = resolved.id;
    }

    const { data: created, error: insErr } = await supabase
      .from("scripture_items")
      .insert({
        user_id: user.id,
        reference,
        translation: translation || null,
        verse_text: verseText,
        notes: null,
        source_type: "import",
      })
      .select("id")
      .single();

    if (insErr) {
      failed.push({ line: line.lineNumber, message: insErr.message });
      continue;
    }

    const itemId = created!.id as string;

    if (listId) {
      const { error: jErr } = await supabase.from("scripture_item_lists").insert({
        scripture_item_id: itemId,
        scripture_list_id: listId,
      });
      if (jErr) {
        await supabase.from("scripture_items").delete().eq("id", itemId).eq("user_id", user.id);
        failed.push({ line: line.lineNumber, message: jErr.message });
        continue;
      }
    }

    imported++;
  }

  revalidateScriptureModule();
  return { success: true, imported, failed };
}

export async function importScriptureVerses(
  formData: FormData
): Promise<
  | { error: string }
  | {
      success: true;
      imported: number;
      failed: { line: number; message: string }[];
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const parsedJsonRaw = formData.get("parsedJson");
  let parsed: ParsedImportLine[];

  if (typeof parsedJsonRaw === "string" && parsedJsonRaw.trim().length > 0) {
    try {
      const decoded = JSON.parse(parsedJsonRaw) as unknown;
      const coerced = coerceParsedImportLinesFromJson(decoded);
      if (!coerced) {
        return { error: "Invalid CSV format" };
      }
      parsed = coerced;
    } catch {
      return { error: "Invalid CSV format" };
    }
  } else {
    const raw = String(formData.get("bulk") ?? "");
    parsed = parseImportBulk(raw);
  }

  return runScriptureImportForParsedLines(r, parsed);
}

export type ReviewVerseRow = {
  item: ScriptureItemDTO;
  grip: "not_started" | "in_progress" | "completed";
  holdStatus: string | null;
  holdNextReviewAt: string | null;
  reviewIntervalOverrideDays: number | null;
};

export async function getAllVersesForReview(): Promise<
  { error: string } | { rows: ReviewVerseRow[] }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data, error } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const { data: memRows, error: me } = await r.supabase
    .from("scripture_item_memory")
    .select("scripture_item_id, grip_status, hold_status, hold_next_review_at, review_interval_override_days")
    .eq("user_id", r.user.id);

  if (me) return { error: me.message };

  const memByItem = new Map<
    string,
    {
      grip_status: string;
      hold_status: string | null;
      hold_next_review_at: string | null;
      review_interval_override_days: number | null;
    }
  >();
  for (const row of memRows ?? []) {
    const od = row.review_interval_override_days;
    memByItem.set(row.scripture_item_id as string, {
      grip_status: row.grip_status as string,
      hold_status: (row.hold_status as string | null) ?? null,
      hold_next_review_at: (row.hold_next_review_at as string | null) ?? null,
      review_interval_override_days:
        od != null && [1, 3, 5, 7, 14, 30].includes(od as number) ? (od as number) : null,
    });
  }

  const rows: ReviewVerseRow[] = (data ?? []).map((row) => {
    const item = mapScriptureItemRow(row as ScriptureItemRowDb);
    const m = memByItem.get(item.id);
    let grip: ReviewVerseRow["grip"] = "not_started";
    if (m?.grip_status === "completed") grip = "completed";
    else if (m) grip = "in_progress";
    return {
      item,
      grip,
      holdStatus: grip === "completed" ? m?.hold_status ?? null : null,
      holdNextReviewAt: grip === "completed" ? m?.hold_next_review_at ?? null : null,
      reviewIntervalOverrideDays: grip === "completed" ? m?.review_interval_override_days ?? null : null,
    };
  });

  return { rows };
}

export type LibraryVerseRow = {
  item: ScriptureItemDTO;
  grip: "not_started" | "in_progress" | "completed";
  holdStatus: string | null;
  holdNextReviewAt: string | null;
  reviewIntervalOverrideDays: number | null;
  reviewDue: boolean;
  listIds: string[];
};

/** All saved verses with memorization/HOLD summary for library filtering. */
export async function getScriptureLibraryRows(): Promise<
  { error: string } | { rows: LibraryVerseRow[]; lists: { id: string; name: string }[] }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: items, error: iErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .order("created_at", { ascending: false });

  if (iErr) return { error: iErr.message };

  const { data: memRows, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id);

  if (mErr) return { error: mErr.message };

  const memByItem = new Map<string, ScriptureItemMemoryRowDb>();
  for (const row of memRows ?? []) {
    memByItem.set(row.scripture_item_id as string, row as ScriptureItemMemoryRowDb);
  }

  const itemIds = (items ?? []).map((it) => it.id as string);
  const listIdsByItem = new Map<string, string[]>();
  if (itemIds.length > 0) {
    const { data: joins, error: jErr } = await r.supabase
      .from("scripture_item_lists")
      .select("scripture_item_id, scripture_list_id")
      .in("scripture_item_id", itemIds);
    if (jErr) return { error: jErr.message };
    for (const j of joins ?? []) {
      const iid = j.scripture_item_id as string;
      const lid = j.scripture_list_id as string;
      const cur = listIdsByItem.get(iid) ?? [];
      cur.push(lid);
      listIdsByItem.set(iid, cur);
    }
  }

  const { data: listRows, error: lrErr } = await r.supabase
    .from("scripture_lists")
    .select("id, name")
    .eq("user_id", r.user.id)
    .order("name", { ascending: true });

  if (lrErr) return { error: lrErr.message };

  const now = Date.now();

  const rows: LibraryVerseRow[] = (items ?? []).map((row) => {
    const item = mapScriptureItemRow(row as ScriptureItemRowDb);
    const memRow = memByItem.get(item.id);
    const listIds = listIdsByItem.get(item.id) ?? [];
    if (!memRow) {
      return {
        item,
        grip: "not_started" as const,
        holdStatus: null,
        holdNextReviewAt: null,
        reviewIntervalOverrideDays: null,
        reviewDue: false,
        listIds,
      };
    }
    const mem = mapGripMemoryRow(memRow);
    let grip: LibraryVerseRow["grip"] = "in_progress";
    if (mem.gripStatus === "completed") grip = "completed";
    const holdNext = mem.holdNextReviewAt ? new Date(mem.holdNextReviewAt).getTime() : null;
    const reviewDue =
      grip === "completed" &&
      mem.holdStatus != null &&
      holdNext != null &&
      holdNext <= now;
    return {
      item,
      grip,
      holdStatus: mem.holdStatus,
      holdNextReviewAt: mem.holdNextReviewAt,
      reviewIntervalOverrideDays: mem.reviewIntervalOverrideDays,
      reviewDue,
      listIds,
    };
  });

  return {
    rows,
    lists: listRows ?? [],
  };
}

export async function getScriptureMemorizePageData(itemId: string): Promise<
  | { error: string }
  | { item: ScriptureItemDTO; memory: GripMemoryDTO; inMyVerses: boolean }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: item, error: itemErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr) return { error: itemErr.message };
  if (!item) return { error: "Verse not found." };

  const ensured = await ensureScriptureMemoryRowInternal(r.supabase, r.user.id, itemId);
  if ("error" in ensured) return ensured;

  const dto = mapScriptureItemRow(item as ScriptureItemRowDb);

  const { data: mv } = await r.supabase
    .from("scripture_my_verses")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();

  return { item: dto, memory: ensured.memory, inMyVerses: Boolean(mv) };
}

async function ensureScriptureMemoryRowInternal(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<{ error: string } | { memory: GripMemoryDTO }> {
  const nowIso = new Date().toISOString();

  const { data: existingRaw, error: exErr } = await supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", userId)
    .eq("scripture_item_id", itemId)
    .maybeSingle();

  if (exErr) return { error: exErr.message };

  if (existingRaw) {
    const existing = existingRaw as ScriptureItemMemoryRowDb;
    const { error: upErr } = await supabase
      .from("scripture_item_memory")
      .update({ last_started_at: nowIso })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (upErr) return { error: upErr.message };
    const { data: again } = await supabase
      .from("scripture_item_memory")
      .select(MEMORY_ROW_SELECT)
      .eq("id", existing.id)
      .single();
    if (!again) return { error: "Could not load memory row." };
    const seeded = await ensureHoldSeededForRow(supabase, userId, again as ScriptureItemMemoryRowDb);
    await syncMyVerseRowFromMemory(supabase, userId, itemId);
    return { memory: mapGripMemoryRow(seeded) };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("scripture_item_memory")
    .insert({
      user_id: userId,
      scripture_item_id: itemId,
      grip_status: "grasp",
      memorize_stage: "context",
      memorize_progress: { v: 1 },
      last_started_at: nowIso,
      last_step_at: nowIso,
    })
    .select(MEMORY_ROW_SELECT)
    .single();

  if (insErr) return { error: insErr.message };
  await syncMyVerseRowFromMemory(supabase, userId, itemId);
  return { memory: mapGripMemoryRow(inserted as ScriptureItemMemoryRowDb) };
}

function normalizePhraseSegments(raw: string[]): string[] {
  return raw.map((s) => s.trim()).filter(Boolean);
}

export async function saveMemorizeContext(
  itemId: string,
  paraphrase: string,
  meaning: string
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "Start from the verse page to begin memorization." };

  const row = raw as ScriptureItemMemoryRowDb;
  const cur = mapGripMemoryRow(row);
  if (cur.memorizeStage === "completed" || cur.gripStatus === "completed") {
    return { error: "This verse is already memorized." };
  }

  const p = paraphrase.trim();
  const m = meaning.trim();
  if (!p || !m) {
    return { error: "Add both a paraphrase and a short meaning before continuing." };
  }

  const nowIso = new Date().toISOString();
  const merged = {
    ...parseMemorizeProgress(row.memorize_progress),
    v: 1 as const,
    context: { paraphraseAndMeaningSaved: true },
  };
  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update({
      memorize_paraphrase: p,
      memorize_meaning: m,
      grasp_paraphrase: p,
      grasp_completed_at: nowIso,
      memorize_progress: merged,
      last_step_at: nowIso,
    })
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return { success: true };
}

export async function saveMemorizePhrases(
  itemId: string,
  segments: string[]
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const cleaned = normalizePhraseSegments(segments);
  if (cleaned.length === 0) {
    return { error: "Add at least one phrase before continuing." };
  }

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "No memory record for this verse." };

  const cur = mapGripMemoryRow(raw as ScriptureItemMemoryRowDb);
  if (cur.memorizeStage === "completed" || cur.gripStatus === "completed") {
    return { error: "This verse is already memorized." };
  }

  const nowIso = new Date().toISOString();
  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update({
      phrase_segments: cleaned,
      last_step_at: nowIso,
    })
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return { success: true };
}

/** After context + phrases, enter Stage 2 (cumulative ladder). */
export async function advanceMemorizeToStage2(
  itemId: string
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "No memory record for this verse." };

  const cur = mapGripMemoryRow(raw as ScriptureItemMemoryRowDb);
  if (cur.memorizeStage === "completed" || cur.gripStatus === "completed") {
    return { error: "Already completed." };
  }
  if (cur.memorizeStage !== "context") {
    return { error: "Finish context and phrases first." };
  }
  if (!(cur.phraseSegments?.length ?? 0)) {
    return { error: "Save phrases before starting Stage 2." };
  }

  const nowIso = new Date().toISOString();
  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update({
      memorize_stage: "stage_2",
      memorize_progress: { v: 1, stage2: { stepIndex: 0, repIndex: 0 } },
      last_step_at: nowIso,
    })
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return { success: true };
}

/** Jump to any memorize ladder step (1–5); resets in-step progress for that stage. */
export async function jumpMemorizeLadderStep(
  itemId: string,
  step: MemorizeLadderStepNumber
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const validSteps: MemorizeLadderStepNumber[] = [1, 2, 3, 4, 5];
  if (!validSteps.includes(step)) {
    return { error: "Invalid step." };
  }

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "No memory record for this verse." };

  const row = raw as ScriptureItemMemoryRowDb;
  const cur = mapGripMemoryRow(row);
  if (cur.memorizeStage === "completed" || cur.gripStatus === "completed") {
    return { error: "This verse is already memorized." };
  }

  const targetStage = ladderStepToMemorizeStage(step);
  const segments = cur.phraseSegments;
  if (step >= 2 && !(segments?.length ?? 0)) {
    return { error: "Save at least one phrase in Step 1 before opening practice steps." };
  }

  const nowIso = new Date().toISOString();
  const nextProgress = memorizeProgressForLadderJump(targetStage, row.memorize_progress);

  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update({
      memorize_stage: targetStage,
      memorize_progress: nextProgress,
      last_step_at: nowIso,
    })
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return { success: true };
}

export async function submitMemorizeRound(
  itemId: string,
  letterSlots: string[],
  wrongAttempts: number
): Promise<
  | { error: string }
  | { success: true; passed: true; accuracy: number; memorizeStage: MemorizeStage }
  | { success: true; passed: false; accuracy: number; memorizeStage: MemorizeStage }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "No memory record for this verse." };

  const cur = mapGripMemoryRow(raw as ScriptureItemMemoryRowDb);
  if (cur.memorizeStage === "completed" || cur.gripStatus === "completed") {
    return { error: "Already completed." };
  }
  if (cur.memorizeStage === "context") {
    return { error: "Start Stage 2 from the Observe step first." };
  }
  const segments = cur.phraseSegments;
  if (!segments?.length) {
    return { error: "Missing saved phrases." };
  }

  if (typeof wrongAttempts !== "number" || wrongAttempts < 0 || wrongAttempts > 5000) {
    return { error: "Invalid attempt count." };
  }

  const { data: itemRow, error: refErr } = await r.supabase
    .from("scripture_items")
    .select("reference")
    .eq("id", itemId)
    .eq("user_id", r.user.id)
    .maybeSingle();
  if (refErr) return { error: refErr.message };

  const refToken = referenceToTypingToken(String(itemRow?.reference ?? ""));

  const result = applyMemorizeRound(segments, cur.memorizeStage, cur.memorizeProgress, letterSlots, {
    referenceTypingToken: refToken,
  });
  if (result.kind !== "memorize") {
    return { error: "Invalid memorization state." };
  }

  if (!result.passed) {
    return {
      success: true,
      passed: false,
      accuracy: result.accuracy,
      memorizeStage: cur.memorizeStage,
    };
  }

  const nowIso = new Date().toISOString();
  const row = raw as ScriptureItemMemoryRowDb;
  const patch: Record<string, unknown> = {
    memorize_stage: result.nextStage,
    memorize_progress: result.nextProgress ?? { v: 1 },
    last_step_at: nowIso,
  };

  if (result.nextStage === "completed") {
    const firstGapDays =
      row.review_interval_override_days != null
        ? row.review_interval_override_days
        : daysForReviewIntervalIndex(0);
    patch.grip_status = "completed";
    patch.completed_at = nowIso;
    patch.say_completed_at = nowIso;
    patch.full_recall_completed_at = nowIso;
    patch.recall_completed_at = nowIso;
    patch.supported_recall_completed_at = nowIso;
    patch.hold_status = "fresh";
    patch.hold_next_review_at = addDaysIsoFromNow(firstGapDays);
    patch.review_stage = "stage_4";
    patch.review_progress = { v: 1, stage4: {} };
    patch.review_interval_index = 0;
  }

  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update(patch)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return {
    success: true,
    passed: true,
    accuracy: result.accuracy,
    memorizeStage: result.nextStage,
  };
}

export type ReviewProgressionKind = "session_complete" | "advanced" | "dropped" | "retry_same";

export async function submitReviewExerciseRound(
  itemId: string,
  letterSlots: string[],
  wrongAttempts: number
): Promise<
  | { error: string }
  | {
      success: true;
      passed: boolean;
      accuracy: number;
      reviewSessionComplete: boolean;
      nextReviewStage: ReviewStage;
      progression: ReviewProgressionKind;
      nextHoldReviewAt: string | null;
    }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: raw, error: curErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (curErr) return { error: curErr.message };
  if (!raw) return { error: "No memory record for this verse." };

  const row = raw as ScriptureItemMemoryRowDb;
  if (row.grip_status !== "completed") {
    return { error: "Finish memorization before review exercises." };
  }

  const cur = mapGripMemoryRow(row);

  const { data: itemRow, error: itemRowErr } = await r.supabase
    .from("scripture_items")
    .select("reference, verse_text")
    .eq("id", itemId)
    .eq("user_id", r.user.id)
    .maybeSingle();
  if (itemRowErr) return { error: itemRowErr.message };

  const segments = phraseSegmentsForReview(cur, String(itemRow?.verse_text ?? ""));
  if (segments.length === 0) {
    return {
      error:
        "Add phrases in memorization first (Context → save phrases), or ensure the verse text isn’t empty.",
    };
  }
  if (typeof wrongAttempts !== "number" || wrongAttempts < 0 || wrongAttempts > 5000) {
    return { error: "Invalid attempt count." };
  }

  const refToken = referenceToTypingToken(String(itemRow?.reference ?? ""));

  const prevReviewStage: ReviewStage = cur.reviewStage ?? INITIAL_REVIEW_STAGE;

  const out = applyReviewRound(
    segments,
    cur.reviewStage,
    row.review_progress,
    letterSlots,
    {
      reviewIntervalIndex: cur.reviewIntervalIndex,
      scheduleOverrideDays: row.review_interval_override_days,
      referenceTypingToken: refToken,
    }
  );

  let progression: ReviewProgressionKind;
  if (out.reviewSessionComplete) {
    progression = "session_complete";
  } else if (!out.passed) {
    progression = out.nextReviewStage === prevReviewStage ? "retry_same" : "dropped";
  } else {
    progression = "advanced";
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    review_stage: out.nextReviewStage,
    review_progress: out.nextReviewProgress ?? { v: 1 },
    last_step_at: nowIso,
  };

  const nextHold =
    out.reviewSessionComplete && out.nextHoldAtIso ? out.nextHoldAtIso : null;

  if (out.reviewSessionComplete && out.nextHoldAtIso) {
    patch.hold_last_reviewed_at = nowIso;
    patch.hold_next_review_at = out.nextHoldAtIso;
    patch.review_interval_index = out.nextIntervalIndex;
    patch.hold_review_count = (row.hold_review_count ?? 0) + 1;
  }

  const { error } = await r.supabase
    .from("scripture_item_memory")
    .update(patch)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId);

  if (error) return { error: error.message };

  revalidateScriptureModule(itemId);
  return {
    success: true,
    passed: out.passed,
    accuracy: out.accuracy,
    reviewSessionComplete: out.reviewSessionComplete,
    nextReviewStage: out.nextReviewStage,
    progression,
    nextHoldReviewAt: nextHold,
  };
}

export async function setScriptureReviewIntervalOverride(
  itemId: string,
  days: number | null
): Promise<{ error: string } | { success: true; memory: GripMemoryDTO }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  if (days != null && !isValidManualReviewIntervalDay(days)) {
    return { error: "Choose a valid interval or default." };
  }

  const { data: updated, error } = await r.supabase
    .from("scripture_item_memory")
    .update({ review_interval_override_days: days })
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .eq("grip_status", "completed")
    .select(MEMORY_ROW_SELECT)
    .single();

  if (error) return { error: error.message };
  if (!updated) return { error: "Verse must be memorized to set review timing." };

  revalidateScriptureModule(itemId);
  return { success: true, memory: mapGripMemoryRow(updated as ScriptureItemMemoryRowDb) };
}

export type HoldQueueEntry = {
  item: ScriptureItemDTO;
  memory: GripMemoryDTO;
  listNames: string[];
  listIds: string[];
};

export async function getHoldReviewQueue(listIdFilter?: string | null): Promise<
  { error: string } | { due: HoldQueueEntry[]; soon: HoldQueueEntry[]; laterCount: number; nextReviewAt: string | null }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: memRows, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("grip_status", "completed")
    .order("hold_next_review_at", { ascending: true, nullsFirst: false });

  if (mErr) return { error: mErr.message };

  const rows = (memRows ?? []) as ScriptureItemMemoryRowDb[];
  const seeded: ScriptureItemMemoryRowDb[] = [];
  for (const row of rows) {
    seeded.push(await ensureHoldSeededForRow(r.supabase, r.user.id, row));
  }

  const itemIds = seeded.map((x) => x.scripture_item_id);
  if (itemIds.length === 0) {
    return { due: [], soon: [], laterCount: 0, nextReviewAt: null };
  }

  const { data: items, error: iErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .in("id", itemIds);

  if (iErr) return { error: iErr.message };

  const itemById = new Map((items ?? []).map((it) => [it.id as string, it]));

  const { data: joins, error: jErr } = await r.supabase
    .from("scripture_item_lists")
    .select("scripture_item_id, scripture_list_id")
    .in("scripture_item_id", itemIds);

  if (jErr) return { error: jErr.message };

  const listIds = [...new Set((joins ?? []).map((j) => j.scripture_list_id as string))];
  let listNameById = new Map<string, string>();
  if (listIds.length > 0) {
    const { data: listRows, error: lrErr } = await r.supabase
      .from("scripture_lists")
      .select("id, name")
      .eq("user_id", r.user.id)
      .in("id", listIds);
    if (lrErr) return { error: lrErr.message };
    listNameById = new Map((listRows ?? []).map((l) => [l.id as string, l.name as string]));
  }

  const listsByItem = new Map<string, string[]>();
  const listIdsByItem = new Map<string, string[]>();
  for (const j of joins ?? []) {
    const iid = j.scripture_item_id as string;
    const lid = j.scripture_list_id as string;
    const name = listNameById.get(lid);
    const idCur = listIdsByItem.get(iid) ?? [];
    idCur.push(lid);
    listIdsByItem.set(iid, idCur);
    if (!name) continue;
    const cur = listsByItem.get(iid) ?? [];
    cur.push(name);
    listsByItem.set(iid, cur);
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const entries: HoldQueueEntry[] = [];
  for (const row of seeded) {
    const it = itemById.get(row.scripture_item_id);
    if (!it) continue;
    if (row.hold_status == null || row.hold_next_review_at == null) continue;
    const mem = mapGripMemoryRow(row);
    const iid = row.scripture_item_id;
    entries.push({
      item: mapScriptureItemRow(it as ScriptureItemRowDb),
      memory: mem,
      listNames: (listsByItem.get(iid) ?? []).sort((a, b) => a.localeCompare(b)),
      listIds: listIdsByItem.get(iid) ?? [],
    });
  }

  const listFilter = listIdFilter?.trim() || null;
  const scoped = listFilter
    ? entries.filter((e) => e.listIds.includes(listFilter))
    : entries;

  const due: HoldQueueEntry[] = [];
  const soon: HoldQueueEntry[] = [];
  let laterCount = 0;
  let nextReviewAt: string | null = null;

  for (const e of scoped) {
    const t = e.memory.holdNextReviewAt;
    if (!t) continue;
    const ts = new Date(t).getTime();
    if (ts <= now) {
      due.push(e);
    } else {
      if (nextReviewAt == null || ts < new Date(nextReviewAt).getTime()) {
        nextReviewAt = t;
      }
      if (ts <= now + weekMs) {
        soon.push(e);
      } else {
        laterCount += 1;
      }
    }
  }

  return { due, soon, laterCount, nextReviewAt };
}

/**
 * After finishing a typed review session, the next destination: another due review item, or null (all caught up).
 * Uses the same due ordering as `getHoldReviewQueue` (earliest `hold_next_review_at` first).
 * Pass `completedItemId` so the verse just completed is skipped if it still appears in the due list briefly.
 */
export async function getPostReviewSessionNavigation(
  completedItemId?: string
): Promise<{ error: string } | { nextReviewHref: string | null }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const q = await getHoldReviewQueue(undefined);
  if ("error" in q) return { error: q.error };

  const due = q.due;
  if (completedItemId) {
    const next = due.find((e) => e.item.id !== completedItemId);
    if (next) return { nextReviewHref: `/scripture/items/${next.item.id}/review` };
    return { nextReviewHref: null };
  }
  const first = due[0];
  if (!first) return { nextReviewHref: null };
  return { nextReviewHref: `/scripture/items/${first.item.id}/review` };
}

export async function getScriptureReviewPageData(itemId: string): Promise<
  | { error: string }
  | { kind: "need_grip" }
  | { item: ScriptureItemDTO; memory: GripMemoryDTO; phrases: string[] }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: item, error: itemErr } = await r.supabase
    .from("scripture_items")
    .select("id, reference, translation, verse_text, notes, source_type, created_at, updated_at")
    .eq("user_id", r.user.id)
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr) return { error: itemErr.message };
  if (!item) return { error: "Verse not found." };

  const { data: memRaw, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();

  if (mErr) return { error: mErr.message };
  if (!memRaw || (memRaw as ScriptureItemMemoryRowDb).grip_status !== "completed") {
    return { kind: "need_grip" };
  }

  const seeded = await ensureHoldSeededForRow(
    r.supabase,
    r.user.id,
    memRaw as ScriptureItemMemoryRowDb
  );
  if (seeded.hold_status == null || seeded.hold_next_review_at == null) {
    return { error: "Could not start review for this verse." };
  }

  const dto = mapScriptureItemRow(item as ScriptureItemRowDb);
  const mem = mapGripMemoryRow(seeded);
  const phraseSegments = phraseSegmentsForReview(mem, dto.verseText);
  if (phraseSegments.length === 0) {
    return {
      error:
        "Add phrases in memorization first (Context → save phrases), or ensure the verse text isn’t empty.",
    };
  }
  return { item: dto, memory: mem, phrases: phraseSegments };
}

/** Legacy easy/okay/hard check-in. Primary path is typed review via `submitReviewExerciseRound`. */
export async function submitHoldReviewOutcome(
  itemId: string,
  outcome: HoldOutcome
): Promise<{ error: string } | { success: true; memory: GripMemoryDTO }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  if (outcome !== "easy" && outcome !== "okay" && outcome !== "hard") {
    return { error: "Invalid outcome." };
  }

  const { data: memRaw, error: mErr } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();

  if (mErr) return { error: mErr.message };
  if (!memRaw) return { error: "No memory record for this verse." };

  const row = memRaw as ScriptureItemMemoryRowDb;
  if (row.grip_status !== "completed") {
    return { error: "Finish memorization for this verse before reviewing." };
  }

  const seeded = await ensureHoldSeededForRow(r.supabase, r.user.id, row);
  if (seeded.hold_status == null) {
    return { error: "Hold is not active for this verse." };
  }

  const raw = seeded.hold_status;
  const currentStatus =
    raw === "fresh" || raw === "strengthening" || raw === "established" ? raw : "fresh";
  const { nextStatus, intervalDays } = nextHoldAfterReview(currentStatus, outcome);
  const now = new Date();
  const nextAt = addDays(now, intervalDays).toISOString();
  const prevCount = seeded.hold_review_count ?? 0;

  const { data: updated, error: uErr } = await r.supabase
    .from("scripture_item_memory")
    .update({
      hold_status: nextStatus,
      hold_next_review_at: nextAt,
      hold_last_reviewed_at: now.toISOString(),
      hold_review_count: prevCount + 1,
      hold_last_outcome: outcome,
      last_step_at: now.toISOString(),
    })
    .eq("id", seeded.id)
    .eq("user_id", r.user.id)
    .select(MEMORY_ROW_SELECT)
    .single();

  if (uErr) return { error: uErr.message };
  if (!updated) return { error: "Update failed." };

  revalidateScriptureModule(itemId);
  return { success: true, memory: mapGripMemoryRow(updated as ScriptureItemMemoryRowDb) };
}

export async function addPassageToMyVerses(
  listId: string,
  itemId: string
): Promise<{ error: string } | { success: true; alreadyAdded?: boolean }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: listOk } = await r.supabase
    .from("scripture_lists")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("id", listId)
    .maybeSingle();
  if (!listOk) return { error: "List not found." };

  const { data: join } = await r.supabase
    .from("scripture_item_lists")
    .select("scripture_item_id")
    .eq("scripture_list_id", listId)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (!join) return { error: "That passage is not in this list." };

  const { data: item } = await r.supabase
    .from("scripture_items")
    .select("id, reference, verse_text")
    .eq("user_id", r.user.id)
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { error: "Verse not found." };

  const { data: existing } = await r.supabase
    .from("scripture_my_verses")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (existing) return { success: true, alreadyAdded: true };

  const { data: maxRow } = await r.supabase
    .from("scripture_my_verses")
    .select("sort_order")
    .eq("user_id", r.user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (typeof maxRow?.sort_order === "number" ? maxRow.sort_order : 0) + 1;

  const { error: insErr } = await r.supabase.from("scripture_my_verses").insert({
    user_id: r.user.id,
    source_list_id: listId,
    scripture_item_id: itemId,
    reference: item.reference,
    passage_text: item.verse_text,
    sort_order: nextOrder,
    status: "not_started",
    current_stage: "context",
  });
  if (insErr) return { error: insErr.message };

  revalidateScriptureModule(itemId);
  return { success: true };
}

export async function getMyVersesQueue(): Promise<
  { error: string } | { rows: MyVerseQueueRowDTO[] }
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: qRows, error: qErr } = await r.supabase
    .from("scripture_my_verses")
    .select(
      "id, source_list_id, scripture_item_id, reference, passage_text, sort_order, status, current_stage, mastered_at"
    )
    .eq("user_id", r.user.id)
    .order("sort_order", { ascending: true });
  if (qErr) return { error: qErr.message };
  if (!qRows?.length) return { rows: [] };

  const ids = qRows.map((x) => x.scripture_item_id as string);
  const { data: memRows } = await r.supabase
    .from("scripture_item_memory")
    .select(MEMORY_ROW_SELECT)
    .eq("user_id", r.user.id)
    .in("scripture_item_id", ids);
  const memById = new Map<string, ScriptureItemMemoryRowDb>();
  for (const m of memRows ?? []) {
    memById.set(m.scripture_item_id as string, m as ScriptureItemMemoryRowDb);
  }

  const rows: MyVerseQueueRowDTO[] = qRows.map((row) => {
    const itemId = row.scripture_item_id as string;
    const memRow = memById.get(itemId);
    const mem = memRow ? mapGripMemoryRow(memRow) : null;
    const status: MyVerseQueueStatus = mem
      ? deriveMyVerseStatusFromMemory(mem)
      : "not_started";
    let currentStageLabel: string | null = null;
    if (mem && !isMemoryMasteredForQueue(mem)) {
      currentStageLabel = memorizationStageShortLabel(mem.memorizeStage);
    }

    return {
      id: row.id as string,
      sourceListId: (row.source_list_id as string | null) ?? null,
      scriptureItemId: itemId,
      reference: String(row.reference),
      passagePreview: passagePreviewFromText(String(row.passage_text)),
      sortOrder: row.sort_order as number,
      status,
      currentStageLabel,
      masteredAt: (row.mastered_at as string | null) ?? null,
    };
  });

  return { rows };
}

export async function getCurrentActiveMyVerse(): Promise<
  { error: string } | { row: MyVerseQueueRowDTO | null }
> {
  const q = await getMyVersesQueue();
  if ("error" in q) return q;
  const first = q.rows.find((row) => row.status !== "mastered");
  return { row: first ?? null };
}

/** Next verse to work on in queue order (first not mastered). */
export async function getNextIncompleteMyVerse(): Promise<
  { error: string } | { row: MyVerseQueueRowDTO | null }
> {
  return getCurrentActiveMyVerse();
}

export async function removeMyVerseFromQueue(
  myVerseId: string
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { error } = await r.supabase
    .from("scripture_my_verses")
    .delete()
    .eq("id", myVerseId)
    .eq("user_id", r.user.id);
  if (error) return { error: error.message };

  revalidateScriptureModule();
  return { success: true };
}

export async function syncMyVerseProgressForItem(
  itemId: string
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };
  await syncMyVerseRowFromMemory(r.supabase, r.user.id, itemId);
  revalidateScriptureModule(itemId);
  return { success: true };
}

export async function markStageComplete(
  _userId: string,
  myVerseId: string,
  _stageNumber: number
): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };
  const { data: row } = await r.supabase
    .from("scripture_my_verses")
    .select("scripture_item_id")
    .eq("user_id", r.user.id)
    .eq("id", myVerseId)
    .maybeSingle();
  if (!row) return { error: "Not found." };
  return syncMyVerseProgressForItem(row.scripture_item_id as string);
}

export async function markVerseMastered(
  _userId: string,
  myVerseId: string
): Promise<{ error: string } | { success: true }> {
  return markStageComplete(_userId, myVerseId, 0);
}

export type ScriptureMemorizeEntryResolution =
  | { kind: "empty" }
  | { kind: "all_mastered" }
  | { kind: "item"; itemId: string };

export async function getScriptureMemorizeEntryTarget(): Promise<
  { error: string } | ScriptureMemorizeEntryResolution
> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: anyRow, error: cErr } = await r.supabase
    .from("scripture_my_verses")
    .select("id")
    .eq("user_id", r.user.id)
    .limit(1);
  if (cErr) return { error: cErr.message };
  if (!anyRow?.length) return { kind: "empty" };

  const firstIncomplete = await getFirstIncompleteMyVerseItemId(r.supabase, r.user.id);
  if (!firstIncomplete) return { kind: "all_mastered" };
  return { kind: "item", itemId: firstIncomplete };
}

/** When the current item is in My Verses, enforce the active queue verse (first incomplete). */
export async function getMemorizeQueueRedirectIfNeeded(
  itemId: string
): Promise<{ error: string } | { href: string | null }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { data: inQ } = await r.supabase
    .from("scripture_my_verses")
    .select("id")
    .eq("user_id", r.user.id)
    .eq("scripture_item_id", itemId)
    .maybeSingle();
  if (!inQ) return { href: null };

  const target = await getFirstIncompleteMyVerseItemId(r.supabase, r.user.id);
  if (!target) return { href: null };
  if (target === itemId) return { href: null };
  return { href: `/scripture/items/${target}/memorize` };
}

export async function getPostMasteryMyVersesNavigation(
  completedItemId: string
): Promise<{ error: string } | { href: string }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  await syncMyVerseRowFromMemory(r.supabase, r.user.id, completedItemId);

  const nextId = await getFirstIncompleteMyVerseItemId(r.supabase, r.user.id);
  if (nextId) return { href: `/scripture/items/${nextId}/memorize` };
  return { href: "/scripture" };
}

export async function deleteScriptureItem(itemId: string): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { error } = await r.supabase
    .from("scripture_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", r.user.id);

  if (error) return { error: error.message };

  revalidateScriptureModule();
  return { success: true };
}

export async function deleteScriptureList(listId: string): Promise<{ error: string } | { success: true }> {
  const r = await requireScriptureOperator();
  if ("error" in r) return { error: r.error };

  const { error } = await r.supabase
    .from("scripture_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", r.user.id);

  if (error) return { error: error.message };

  revalidateScriptureModule();
  return { success: true };
}
