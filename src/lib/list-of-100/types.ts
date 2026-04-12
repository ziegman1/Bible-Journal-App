export type SpiritualStatus = "believer" | "unknown" | "unbeliever";

export type NetworkListLineDTO = {
  lineNumber: number;
  name: string;
  invitePlannedDate: string | null;
  spiritualStatus: SpiritualStatus | null;
  /** Weekly CHAT evangelistic prayer focus; max 5 true per user (enforced server-side). */
  isEvangelisticPrayerFocus: boolean;
};

export const LIST_OF_100_MAX_LINES = 100;

export const EVANGELISTIC_PRAYER_FOCUS_MAX = 5;
