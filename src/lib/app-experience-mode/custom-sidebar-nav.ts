import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";

/** When custom dashboard has no items saved, sidebar still exposes core rhythm tools. */
export const CUSTOM_SIDEBAR_EMPTY_FALLBACK_ITEMS: readonly DashboardItemId[] = [
  "feature_soaps",
  "feature_pray",
];

/**
 * Ordered dashboard item ids for sidebar derivation (non-empty or fallback).
 */
export function resolveCustomDashboardSidebarItemIds(itemIds: readonly DashboardItemId[]): DashboardItemId[] {
  if (itemIds.length > 0) return [...itemIds];
  return [...CUSTOM_SIDEBAR_EMPTY_FALLBACK_ITEMS];
}

/**
 * Tool routes to show in the app shell when Custom mode filters the sidebar.
 * Order is not significant for filtering; AppShell applies a stable nav order.
 */
export function customDashboardNavHrefsFromItemIds(itemIds: readonly DashboardItemId[]): Set<string> {
  const hrefs = new Set<string>();
  for (const id of itemIds) {
    switch (id) {
      case "feature_soaps":
        hrefs.add("/app/soaps");
        break;
      case "feature_pray":
        hrefs.add("/app/prayer");
        break;
      case "feature_scripture_memory":
        hrefs.add("/app/scripture-memory");
        break;
      case "feature_share":
        hrefs.add("/app/share");
        break;
      case "feature_chat":
        hrefs.add("/app/chat");
        break;
      case "feature_thirds":
        hrefs.add("/app/groups");
        break;
      case "feature_discipleship_momentum":
      case "growth_transformed_person":
      case "growth_mawl":
      case "growth_pathway":
        hrefs.add("/app/process-map");
        break;
      case "feature_read":
        hrefs.add("/app/read");
        break;
      case "feature_list_of_100":
        hrefs.add("/app/list-of-100");
        break;
      default:
        break;
    }
  }
  return hrefs;
}
