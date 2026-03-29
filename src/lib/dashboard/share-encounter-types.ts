export const SHARE_TYPES = ["gospel", "testimony", "both"] as const;
export type ShareEncounterSharedType = (typeof SHARE_TYPES)[number];

export const SHARE_RECEIVED = [
  "red_light",
  "yellow_light",
  "green_light",
  "already_christian",
] as const;
export type ShareEncounterReceived = (typeof SHARE_RECEIVED)[number];

export const SHARE_FOLLOW_UPS = ["discovery_group", "thirds_group", "none"] as const;
export type ShareEncounterFollowUp = (typeof SHARE_FOLLOW_UPS)[number];

export type ShareReceivedCounts = Record<ShareEncounterReceived, number>;

export function emptyShareReceivedCounts(): ShareReceivedCounts {
  return {
    red_light: 0,
    yellow_light: 0,
    green_light: 0,
    already_christian: 0,
  };
}

export function isShareEncounterReceived(v: string): v is ShareEncounterReceived {
  return (SHARE_RECEIVED as readonly string[]).includes(v);
}

export function isShareEncounterSharedType(v: string): v is ShareEncounterSharedType {
  return (SHARE_TYPES as readonly string[]).includes(v);
}

export function isShareEncounterFollowUp(v: string): v is ShareEncounterFollowUp {
  return (SHARE_FOLLOW_UPS as readonly string[]).includes(v);
}
