export type SpiritualStatus = "believer" | "unknown" | "unbeliever";

export type NetworkListLineDTO = {
  lineNumber: number;
  name: string;
  invitePlannedDate: string | null;
  spiritualStatus: SpiritualStatus | null;
};

export const LIST_OF_100_MAX_LINES = 100;
