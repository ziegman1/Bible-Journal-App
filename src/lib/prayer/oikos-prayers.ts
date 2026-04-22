import { CHAT_EVANGELISTIC_PRAYERS } from "@/content/chat-accountability-content";

/** Re-export for the Oikos flow (same lines as CHAT evangelistic prayer list). */
export const OIKOS_PRAYER_TEMPLATES = CHAT_EVANGELISTIC_PRAYERS;

/**
 * Fills `_____` placeholders with the person’s name.
 */
export function formatOikosPrayerLine(template: string, name: string): string {
  const n = name.trim();
  return template.replaceAll("_____", n);
}
