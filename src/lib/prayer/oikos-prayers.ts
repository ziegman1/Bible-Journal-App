import { CHAT_EVANGELISTIC_PRAYERS } from "@/content/chat-accountability-content";

/** Re-export for the Oikos flow (same lines as CHAT evangelistic prayer list). */
export const OIKOS_PRAYER_TEMPLATES = CHAT_EVANGELISTIC_PRAYERS;

/** 0-based index of the 7th prayer — first blank left empty, name only in the second blank. */
export const OIKOS_SEVENTH_PRAYER_INDEX = 6;

/**
 * Fills `_____` placeholders with the person’s name.
 * Prayer #7 (index 6): first blank empty, name only in the second blank.
 */
export function formatOikosPrayerLine(template: string, name: string, pointIndexZeroBased: number): string {
  const n = name.trim();
  if (pointIndexZeroBased === OIKOS_SEVENTH_PRAYER_INDEX) {
    return template
      .replace("_____", "")
      .replace("_____", n)
      .replace("or  the", "or the");
  }
  return template.replaceAll("_____", n);
}
