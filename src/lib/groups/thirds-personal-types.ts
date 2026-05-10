import type { PriorFinalizedCommitments, SuggestedLookForward } from "@/lib/groups/thirds-personal-helpers";

export type { SuggestedLookForward };

export type SoloLookUpMode = "devotional" | "dbs";

export type ThirdsPersonalDbsObservationType =
  | "like"
  | "difficult"
  | "teaches_about_people"
  | "teaches_about_god";

export type ThirdsPersonalDbsObservationDTO = {
  id: string;
  personal_week_id: string;
  observation_type: ThirdsPersonalDbsObservationType;
  book: string;
  chapter: number;
  verse_number: number;
  verse_end: number | null;
  note: string;
};

export type ThirdsPersonalWeekDTO = {
  id: string;
  week_start_monday: string;
  prior_obedience_done: boolean;
  prior_sharing_done: boolean;
  prior_train_done: boolean;
  /** Solo Share & Care journaling (optional). */
  look_back_share_care: string;
  /** Solo Vision-step reflection (optional). */
  look_back_vision_reflection: string;
  passage_ref: string;
  look_up_preset_story_id: string | null;
  look_up_book: string;
  look_up_chapter: number | null;
  look_up_verse_start: number | null;
  look_up_verse_end: number | null;
  observation_like: string;
  observation_difficult: string;
  observation_teaches_people: string;
  observation_teaches_god: string;
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment: string;
  finalized_at: string | null;
  /** Set when the week is finalized; null for legacy weeks before this column existed. */
  completed_look_up_mode: SoloLookUpMode | null;
};

export type ThirdsPersonalWorkspacePayload = {
  week: ThirdsPersonalWeekDTO;
  currentWeekMondayYmd: string;
  priorFinalized: PriorFinalizedCommitments | null;
  suggestedLookForward: SuggestedLookForward;
  /** Saved preference; defaults to devotional when unset. */
  soloLookUpMode: SoloLookUpMode;
  /** Verse-anchored rows for DBS mode (may be empty). */
  dbsObservations: ThirdsPersonalDbsObservationDTO[];
};

export type ThirdsParticipationStats = {
  hasSettings: boolean;
  participationStartedOn: string | null;
  participatedWeeks: number;
  totalWeeks: number;
  percent: number | null;
  informalGroupsCompleted: number;
};
