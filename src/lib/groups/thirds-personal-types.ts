import type { PriorFinalizedCommitments, SuggestedLookForward } from "@/lib/groups/thirds-personal-helpers";

export type { SuggestedLookForward };

export type ThirdsPersonalWeekDTO = {
  id: string;
  week_start_monday: string;
  prior_obedience_done: boolean;
  prior_sharing_done: boolean;
  prior_train_done: boolean;
  passage_ref: string;
  observation_like: string;
  observation_difficult: string;
  observation_teaches_people: string;
  observation_teaches_god: string;
  obedience_statement: string;
  sharing_commitment: string;
  train_commitment: string;
  finalized_at: string | null;
};

export type ThirdsPersonalWorkspacePayload = {
  week: ThirdsPersonalWeekDTO;
  currentWeekMondayYmd: string;
  priorFinalized: PriorFinalizedCommitments | null;
  suggestedLookForward: SuggestedLookForward;
};

export type ThirdsParticipationStats = {
  hasSettings: boolean;
  participationStartedOn: string | null;
  participatedWeeks: number;
  totalWeeks: number;
  percent: number | null;
  informalGroupsCompleted: number;
};
