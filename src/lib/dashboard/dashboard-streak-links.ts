import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { STREAK_LABELS } from "@/lib/app-experience-mode/dashboard-items";

/** Main hub routes for dashboard streak tiles (not log/create/start flows). */
export function streakMainHrefForDashboardItem(id: DashboardItemId): string | null {
  switch (id) {
    case "feature_soaps":
      return "/app/soaps";
    case "feature_pray":
      return "/app/prayer";
    case "feature_share":
      return "/app/share";
    case "feature_scripture_memory":
      return "/app/scripture-memory";
    case "feature_chat":
      return "/app/chat";
    case "feature_thirds":
      return "/app/groups";
    default:
      return null;
  }
}

export function streakOpenAriaForDashboardItem(id: DashboardItemId): string {
  switch (id) {
    case "feature_soaps":
      return "Open SOAPS page";
    case "feature_pray":
      return "Open Prayer page";
    case "feature_share":
      return "Open Share page";
    case "feature_scripture_memory":
      return "Open Scripture Memory page";
    case "feature_chat":
      return "Open CHAT page";
    case "feature_thirds":
      return "Open 3/3rds Groups page";
    default:
      return "Open practice page";
  }
}

/** Matches labels returned by {@link getIdentityStreakStats} / {@link STREAK_LABELS}. */
export function streakMainHrefForStreakStatLabel(label: string): string | undefined {
  switch (label) {
    case STREAK_LABELS.soaps:
      return "/app/soaps";
    case STREAK_LABELS.prayer:
      return "/app/prayer";
    case STREAK_LABELS.share:
      return "/app/share";
    case STREAK_LABELS.scriptureMemory:
      return "/app/scripture-memory";
    case STREAK_LABELS.thirdsWeekly:
      return "/app/groups";
    case STREAK_LABELS.chatWeekly:
      return "/app/chat";
    default:
      return undefined;
  }
}

export function streakOpenAriaForStreakStatLabel(label: string): string {
  switch (label) {
    case STREAK_LABELS.soaps:
      return "Open SOAPS page";
    case STREAK_LABELS.prayer:
      return "Open Prayer page";
    case STREAK_LABELS.share:
      return "Open Share page";
    case STREAK_LABELS.scriptureMemory:
      return "Open Scripture Memory page";
    case STREAK_LABELS.thirdsWeekly:
      return "Open 3/3rds Groups page";
    case STREAK_LABELS.chatWeekly:
      return "Open CHAT page";
    default:
      return `Open page for ${label}`;
  }
}
