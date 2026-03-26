export type StarterTrackLookBackPayload = {
  groupVisionStatement: string | null;
  checkUpMode: "week1_teaching" | "prior_group_commitments";
  priorWeekByMember: {
    userId: string;
    displayName: string;
    obedience: string;
    sharing: string;
    train: string;
  }[];
};
