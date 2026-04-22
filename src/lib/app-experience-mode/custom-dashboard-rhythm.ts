import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { STREAK_LABELS } from "@/lib/app-experience-mode/dashboard-items";

/** Items that render a primary quick-action shortcut on the custom dashboard. */
export const CUSTOM_DASHBOARD_QUICK_ACTION_ITEM_IDS = [
  "feature_soaps",
  "feature_pray",
  "feature_scripture_memory",
] as const satisfies readonly DashboardItemId[];

/** Items that render an identity streak / rhythm tile on the custom dashboard. */
export const CUSTOM_DASHBOARD_STREAK_ITEM_IDS = [
  "feature_soaps",
  "feature_pray",
  "feature_share",
  "feature_scripture_memory",
  "feature_chat",
  "feature_thirds",
] as const satisfies readonly DashboardItemId[];

const QUICK_SET = new Set<DashboardItemId>(CUSTOM_DASHBOARD_QUICK_ACTION_ITEM_IDS);
const STREAK_SET = new Set<DashboardItemId>(CUSTOM_DASHBOARD_STREAK_ITEM_IDS);

export type QuickActionSpec = { href: string; label: string };

export function dashboardItemHasQuickAction(id: DashboardItemId): boolean {
  return QUICK_SET.has(id);
}

export function dashboardItemHasStreakTile(id: DashboardItemId): boolean {
  return STREAK_SET.has(id);
}

export function quickActionForDashboardItem(
  id: DashboardItemId,
  soapsActionHref: string,
  soapsActionLabel: string
): QuickActionSpec | null {
  switch (id) {
    case "feature_soaps":
      return { href: soapsActionHref, label: soapsActionLabel };
    case "feature_pray":
      return { href: "/app/prayer", label: "Pray" };
    case "feature_scripture_memory":
      return { href: "/app/scripture-memory", label: "Scripture Memory" };
    default:
      return null;
  }
}

export type StreakLabelKey = keyof typeof STREAK_LABELS;

export function streakLabelKeyForDashboardItem(id: DashboardItemId): StreakLabelKey | null {
  switch (id) {
    case "feature_soaps":
      return "soaps";
    case "feature_pray":
      return "prayer";
    case "feature_share":
      return "share";
    case "feature_scripture_memory":
      return "scriptureMemory";
    case "feature_chat":
      return "chatWeekly";
    case "feature_thirds":
      return "thirdsWeekly";
    default:
      return null;
  }
}
