/**
 * Guest Personal 3/3rds: full {@link ThirdsPersonalWorkspacePayload} in sessionStorage only.
 * Authenticated users continue to load/save via `getThirdsPersonalWorkspace` and server actions.
 */

import { buildSuggestedLookForward } from "@/lib/groups/thirds-personal-helpers";
import type { ThirdsPersonalWorkspacePayload } from "@/lib/groups/thirds-personal-types";

export const GUEST_THIRDS_WORKSPACE_STORAGE_KEY = "badwr_guest_thirds_workspace_v1";

/** Stable synthetic id — never sent to Supabase from guest flows. */
export const GUEST_THIRDS_PERSONAL_WEEK_ID = "guest-personal-week-local";

type StoredEnvelope = {
  v: 1;
  weekStartMondayYmd: string;
  payload: ThirdsPersonalWorkspacePayload;
};

function safeParse(raw: string | null): StoredEnvelope | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as StoredEnvelope;
    if (o?.v === 1 && o.weekStartMondayYmd && o.payload?.week) return o;
  } catch {
    /* ignore */
  }
  return null;
}

/** Default empty guest week for the given UTC Monday (matches server week shape). */
export function buildDefaultGuestThirdsPayload(currentWeekMondayYmd: string): ThirdsPersonalWorkspacePayload {
  const week = {
    id: GUEST_THIRDS_PERSONAL_WEEK_ID,
    week_start_monday: currentWeekMondayYmd,
    prior_obedience_done: false,
    prior_sharing_done: false,
    prior_train_done: false,
    look_back_share_care: "",
    look_back_vision_reflection: "",
    passage_ref: "",
    look_up_preset_story_id: null,
    look_up_book: "",
    look_up_chapter: null,
    look_up_verse_start: null,
    look_up_verse_end: null,
    observation_like: "",
    observation_difficult: "",
    observation_teaches_people: "",
    observation_teaches_god: "",
    obedience_statement: "",
    sharing_commitment: "",
    train_commitment: "",
    finalized_at: null,
    completed_look_up_mode: null,
  };
  return {
    week,
    currentWeekMondayYmd,
    priorFinalized: null,
    suggestedLookForward: buildSuggestedLookForward(week, null),
    soloLookUpMode: "devotional",
    dbsObservations: [],
  };
}

/**
 * Load guest Personal 3/3rds workspace from sessionStorage, or seed defaults when missing / week changed.
 * Browser-only — call from client components or `useState` initializers guarded by `typeof window`.
 */
export function loadThirdsState(currentWeekMondayYmd: string): ThirdsPersonalWorkspacePayload {
  if (typeof window === "undefined") {
    return buildDefaultGuestThirdsPayload(currentWeekMondayYmd);
  }
  const env = safeParse(sessionStorage.getItem(GUEST_THIRDS_WORKSPACE_STORAGE_KEY));
  if (!env || env.weekStartMondayYmd !== currentWeekMondayYmd) {
    return buildDefaultGuestThirdsPayload(currentWeekMondayYmd);
  }
  return env.payload;
}

/** Persist full guest workspace snapshot (sessionStorage — cleared when the browser session ends). */
export function saveThirdsState(payload: ThirdsPersonalWorkspacePayload): void {
  if (typeof window === "undefined") return;
  const envelope: StoredEnvelope = {
    v: 1,
    weekStartMondayYmd: payload.currentWeekMondayYmd,
    payload,
  };
  try {
    sessionStorage.setItem(GUEST_THIRDS_WORKSPACE_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* quota / private mode */
  }
}
