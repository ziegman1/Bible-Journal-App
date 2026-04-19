import type { HoldOutcome, HoldStatus } from "@/lib/scripture-module/hold-schedule";
import type { MemorizeProgressV1, MemorizeStage, ReviewStage } from "@/lib/scripture-module/memorize-stage-types";
import { parseMemorizeProgress } from "@/lib/scripture-module/memorize-engine";

export type { MemorizeStage, ReviewStage, MemorizeProgressV1 } from "@/lib/scripture-module/memorize-stage-types";

export type ScriptureSourceType = "manual" | "import";

export type ScriptureItemDTO = {
  id: string;
  reference: string;
  translation: string | null;
  verseText: string;
  notes: string | null;
  sourceType: ScriptureSourceType;
  createdAt: string;
  updatedAt: string;
};

export type ScriptureListDTO = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  verseCount: number;
};

/** Personal Scripture Memory queue (“My Verses”). */
export type MyVerseQueueStatus = "not_started" | "in_progress" | "mastered";

export type MyVerseQueueRowDTO = {
  id: string;
  sourceListId: string | null;
  scriptureItemId: string;
  reference: string;
  passagePreview: string;
  sortOrder: number;
  status: MyVerseQueueStatus;
  currentStageLabel: string | null;
  masteredAt: string | null;
};

/** Row shape from `scripture_items` selects */
export type ScriptureItemRowDb = {
  id: string;
  reference: string;
  translation: string | null;
  verse_text: string;
  notes: string | null;
  source_type: string;
  created_at: string;
  updated_at: string;
};

/** Legacy DB values; UI only distinguishes completed vs in-progress. */
export type GripStatus = "grasp" | "recall" | "say" | "completed";

export type GripMemoryDTO = {
  id: string;
  gripStatus: GripStatus;
  memorizeStage: MemorizeStage;
  memorizeProgress: MemorizeProgressV1;
  memorizeParaphrase: string | null;
  memorizeMeaning: string | null;
  phraseSegments: string[] | null;
  supportedRecallCompletedAt: string | null;
  fullRecallCompletedAt: string | null;
  graspParaphrase: string | null;
  graspCompletedAt: string | null;
  recallCompletedAt: string | null;
  sayCompletedAt: string | null;
  completedAt: string | null;
  lastStartedAt: string | null;
  lastStepAt: string | null;
  /** Next review exercise stage after memorization completes; null until completed. */
  reviewStage: ReviewStage | null;
  reviewProgress: MemorizeProgressV1;
  reviewIntervalIndex: number;
  /** If set, days until next review after a cycle; null uses default cadence from review_interval_index. */
  reviewIntervalOverrideDays: number | null;
  /** Present after initial memorization completes; seeded for retention (HOLD). */
  holdStatus: HoldStatus | null;
  holdNextReviewAt: string | null;
  holdLastReviewedAt: string | null;
  holdReviewCount: number;
  holdLastOutcome: HoldOutcome | null;
};

export type ScriptureItemMemoryRowDb = {
  id: string;
  user_id: string;
  scripture_item_id: string;
  grip_status: string;
  memorize_stage: string;
  memorize_progress: unknown;
  memorize_paraphrase: string | null;
  memorize_meaning: string | null;
  phrase_segments: unknown;
  supported_recall_completed_at: string | null;
  full_recall_completed_at: string | null;
  grasp_paraphrase: string | null;
  grasp_completed_at: string | null;
  recall_completed_at: string | null;
  say_completed_at: string | null;
  completed_at: string | null;
  last_started_at: string | null;
  last_step_at: string | null;
  review_stage: string | null;
  review_progress: unknown;
  review_interval_index: number | null;
  review_interval_override_days: number | null;
  hold_status: string | null;
  hold_next_review_at: string | null;
  hold_last_reviewed_at: string | null;
  hold_review_count: number | null;
  hold_last_outcome: string | null;
  created_at: string;
  updated_at: string;
};

function mapHoldStatus(raw: string | null | undefined): HoldStatus | null {
  if (raw === "fresh" || raw === "strengthening" || raw === "established") return raw;
  return null;
}

function mapHoldOutcome(raw: string | null | undefined): HoldOutcome | null {
  if (raw === "easy" || raw === "okay" || raw === "hard") return raw;
  return null;
}

const MEMORIZE_STAGES: readonly MemorizeStage[] = [
  "context",
  "stage_2",
  "stage_3",
  "stage_4",
  "stage_5",
  "completed",
] as const;

function mapMemorizeStage(raw: string | undefined | null, gripStatus: string): MemorizeStage {
  if (raw && (MEMORIZE_STAGES as readonly string[]).includes(raw)) {
    return raw as MemorizeStage;
  }
  if (gripStatus === "completed") return "completed";
  return "context";
}

const REVIEW_STAGES: readonly ReviewStage[] = ["stage_2", "stage_3", "stage_4", "stage_5"];

function mapReviewStage(raw: string | null | undefined): ReviewStage | null {
  if (raw && (REVIEW_STAGES as readonly string[]).includes(raw)) return raw as ReviewStage;
  return null;
}

/** Parse phrase_segments JSON from DB (array of strings). */
function parsePhraseSegments(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string") out.push(x);
  }
  return out.length ? out : null;
}

export function mapGripMemoryRow(r: ScriptureItemMemoryRowDb): GripMemoryDTO {
  const st = r.grip_status;
  const gripStatus: GripStatus =
    st === "recall" || st === "say" || st === "completed" || st === "grasp" ? st : "grasp";
  return {
    id: r.id,
    gripStatus,
    memorizeStage: mapMemorizeStage(r.memorize_stage, st),
    memorizeProgress: parseMemorizeProgress(r.memorize_progress),
    memorizeParaphrase: r.memorize_paraphrase,
    memorizeMeaning: r.memorize_meaning,
    phraseSegments: parsePhraseSegments(r.phrase_segments),
    supportedRecallCompletedAt: r.supported_recall_completed_at,
    fullRecallCompletedAt: r.full_recall_completed_at,
    graspParaphrase: r.grasp_paraphrase,
    graspCompletedAt: r.grasp_completed_at,
    recallCompletedAt: r.recall_completed_at,
    sayCompletedAt: r.say_completed_at,
    completedAt: r.completed_at,
    lastStartedAt: r.last_started_at,
    lastStepAt: r.last_step_at,
    reviewStage: mapReviewStage(r.review_stage),
    reviewProgress: parseMemorizeProgress(r.review_progress),
    reviewIntervalIndex: r.review_interval_index ?? 0,
    reviewIntervalOverrideDays:
      r.review_interval_override_days != null &&
      [1, 3, 5, 7, 14, 30].includes(r.review_interval_override_days)
        ? r.review_interval_override_days
        : null,
    holdStatus: mapHoldStatus(r.hold_status),
    holdNextReviewAt: r.hold_next_review_at,
    holdLastReviewedAt: r.hold_last_reviewed_at,
    holdReviewCount: r.hold_review_count ?? 0,
    holdLastOutcome: mapHoldOutcome(r.hold_last_outcome),
  };
}

export function mapScriptureItemRow(r: ScriptureItemRowDb): ScriptureItemDTO {
  return {
    id: r.id,
    reference: r.reference,
    translation: r.translation,
    verseText: r.verse_text,
    notes: r.notes,
    sourceType: r.source_type === "import" ? "import" : "manual",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
