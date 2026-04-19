/**
 * v1 presentation-only copy: maps engine `practiceType` / `subtype` to short, user-facing lines.
 * Extend here as new practices appear — does not affect scoring.
 */

import type { PracticeType } from "@/lib/metrics/formation-momentum/types";

/**
 * Single friendly line for “why” bullets. Prefer subtype when it changes meaning (e.g. memory review vs new).
 */
export function practiceInsightPhrase(practiceType: PracticeType, subtype?: string): string {
  const st = subtype ?? "";

  switch (practiceType) {
    case "prayer":
      return "Consistent prayer this week";
    case "soaps":
      return "Regular SOAPS journaling this week";
    case "memory": {
      if (st === "memory_review" || st === "review") {
        return "Regular Scripture memory review";
      }
      if (st === "memory_new" || st === "new") {
        return "New Scripture memory work this week";
      }
      return "Scripture memory activity this week";
    }
    case "chat":
      return "CHAT or discipleship conversation this week";
    case "thirds": {
      if (st.includes("thirds") || st === "thirds_week_participation") {
        return "3/3rds group participation this week";
      }
      return "3/3rds rhythm this week";
    }
    case "share":
      return "Sharing your faith with others this week";
    default:
      return "Activity in this practice area this week";
  }
}
