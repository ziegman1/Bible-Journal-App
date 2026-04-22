import type { AppExperienceMode } from "./types";
import type { DashboardModuleId } from "./dashboard-modules";
import { isDashboardModuleId, parseCustomDashboardModules } from "./dashboard-modules";

/**
 * Selectable custom-dashboard ids. Header + Me/BADWR name are always shown (not listed here).
 * Rhythm features bundle identity quick action (when applicable), streak, and daily practice card.
 */
export const DASHBOARD_ITEM_IDS = [
  "feature_soaps",
  "feature_pray",
  "feature_share",
  "feature_scripture_memory",
  "feature_chat",
  "feature_thirds",
  "feature_discipleship_momentum",
  "feature_read",
  "feature_list_of_100",
  "growth_transformed_person",
  "growth_mawl",
  "growth_pathway",
] as const;

export type DashboardItemId = (typeof DASHBOARD_ITEM_IDS)[number];

const ID_SET = new Set<string>(DASHBOARD_ITEM_IDS);

export function isDashboardItemId(value: unknown): value is DashboardItemId {
  return typeof value === "string" && ID_SET.has(value);
}

/** Granular ids from the previous custom-dashboard model → one feature id (or null to strip). */
const LEGACY_GRANULAR_TO_FEATURE = {
  header_dashboard: null,
  identity_profile: null,
  identity_quick_soaps: "feature_soaps",
  identity_quick_pray: "feature_pray",
  identity_quick_scripture_memory: "feature_scripture_memory",
  streak_soaps: "feature_soaps",
  streak_prayer: "feature_pray",
  streak_share: "feature_share",
  streak_scripture_memory: "feature_scripture_memory",
  streak_thirds_weekly: "feature_thirds",
  streak_chat_weekly: "feature_chat",
  gauge_foundation: "feature_discipleship_momentum",
  gauge_formation: "feature_discipleship_momentum",
  gauge_reproduction: "feature_discipleship_momentum",
  tool_soaps: "feature_soaps",
  tool_pray: "feature_pray",
  tool_share: "feature_share",
  tool_scripture_memory: "feature_scripture_memory",
  tool_chat: "feature_chat",
  tool_thirds: "feature_thirds",
  tool_read: "feature_read",
  tool_list_of_100: "feature_list_of_100",
  community_thirds_family: "feature_thirds",
  growth_transformed_person: "growth_transformed_person",
  growth_mawl: "growth_mawl",
  growth_pathway: "growth_pathway",
} as Record<string, DashboardItemId | null>;

function mapRawTokenToFeatureId(token: string): DashboardItemId | null {
  if (isDashboardItemId(token)) return token;
  const mapped = LEGACY_GRANULAR_TO_FEATURE[token as keyof typeof LEGACY_GRANULAR_TO_FEATURE];
  return mapped ?? null;
}

/** Parse DB array: accept current ids + legacy granular ids, dedupe, stable canonical order. */
export function parseCustomDashboardItems(raw: unknown): DashboardItemId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<DashboardItemId>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const fid = mapRawTokenToFeatureId(item);
    if (fid) seen.add(fid);
  }
  return DASHBOARD_ITEM_IDS.filter((id) => seen.has(id));
}

export type DashboardItemGroupId = "rhythms" | "growth_gauges" | "extras" | "reproduction";

export interface DashboardItemDefinition {
  id: DashboardItemId;
  title: string;
  description: string;
  groupId: DashboardItemGroupId;
  helpKey: string;
  tutorialKey: string;
}

export const DASHBOARD_ITEM_GROUP_LABEL: Record<DashboardItemGroupId, string> = {
  rhythms: "Rhythms & tools",
  growth_gauges: "Growth & momentum",
  extras: "Reading & lists",
  reproduction: "Reproduction & pathway",
};

export const DASHBOARD_ITEM_DEFINITIONS: readonly DashboardItemDefinition[] = [
  {
    id: "feature_soaps",
    title: "SOAPS",
    description: "Identity SOAPS button, SOAPS streak, and SOAPS practice card together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.soaps",
    tutorialKey: "tutorial.dashboard.feature.soaps",
  },
  {
    id: "feature_pray",
    title: "Prayer",
    description: "Pray shortcut, prayer streak, and prayer wheel card together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.pray",
    tutorialKey: "tutorial.dashboard.feature.pray",
  },
  {
    id: "feature_share",
    title: "Share",
    description: "Share streak and share practice card together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.share",
    tutorialKey: "tutorial.dashboard.feature.share",
  },
  {
    id: "feature_scripture_memory",
    title: "Scripture Memory",
    description: "Scripture Memory shortcut, memory streak, and memory card together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.memory",
    tutorialKey: "tutorial.dashboard.feature.memory",
  },
  {
    id: "feature_chat",
    title: "CHAT",
    description: "CHAT weekly streak and CHAT reading card (or join-CHAT prompt) together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.chat",
    tutorialKey: "tutorial.dashboard.feature.chat",
  },
  {
    id: "feature_thirds",
    title: "3/3rds",
    description: "3/3 weekly streak, 3/3rds practice card, and 3/3rds Family community card together.",
    groupId: "rhythms",
    helpKey: "dashboard.feature.thirds",
    tutorialKey: "tutorial.dashboard.feature.thirds",
  },
  {
    id: "feature_discipleship_momentum",
    title: "Discipleship momentum",
    description:
      "Foundation, Formation, and Reproduction gauges together with coaching copy and weekly signals.",
    groupId: "growth_gauges",
    helpKey: "dashboard.feature.momentum",
    tutorialKey: "tutorial.dashboard.feature.momentum",
  },
  {
    id: "feature_read",
    title: "Read Scripture",
    description: "Shortcut to choose a book and read chapters.",
    groupId: "extras",
    helpKey: "dashboard.feature.read",
    tutorialKey: "tutorial.dashboard.feature.read",
  },
  {
    id: "feature_list_of_100",
    title: "List of 100",
    description: "Shortcut to your List of 100 stewardship list.",
    groupId: "extras",
    helpKey: "dashboard.feature.list100",
    tutorialKey: "tutorial.dashboard.feature.list100",
  },
  {
    id: "growth_transformed_person",
    title: "Transformed Person",
    description: "Growth pathway card: fruit, habits, next steps.",
    groupId: "reproduction",
    helpKey: "dashboard.growth.transformed",
    tutorialKey: "tutorial.dashboard.growth.transformed",
  },
  {
    id: "growth_mawl",
    title: "MAWL",
    description: "Model, Assist, Watch, Lead multiplication card.",
    groupId: "reproduction",
    helpKey: "dashboard.growth.mawl",
    tutorialKey: "tutorial.dashboard.growth.mawl",
  },
  {
    id: "growth_pathway",
    title: "Pathway",
    description: "Discipleship pathway and next steps card.",
    groupId: "reproduction",
    helpKey: "dashboard.growth.pathway",
    tutorialKey: "tutorial.dashboard.growth.pathway",
  },
];

const GROUP_ORDER: readonly DashboardItemGroupId[] = [
  "rhythms",
  "growth_gauges",
  "extras",
  "reproduction",
];

export function dashboardItemsByGroup(): Map<DashboardItemGroupId, DashboardItemDefinition[]> {
  const map = new Map<DashboardItemGroupId, DashboardItemDefinition[]>();
  for (const g of GROUP_ORDER) {
    map.set(g, []);
  }
  for (const def of DASHBOARD_ITEM_DEFINITIONS) {
    map.get(def.groupId)!.push(def);
  }
  return map;
}

/** Streak labels from `getIdentityStreakStats` (must stay in sync). */
export const STREAK_LABELS = {
  soaps: "SOAPS streak",
  prayer: "Prayer streak",
  share: "Share streak",
  scriptureMemory: "Scripture Memory streak",
  thirdsWeekly: "3/3 weekly streak",
  chatWeekly: "CHAT weekly streak",
} as const;

const LEGACY_MODULE_ITEMS: Record<DashboardModuleId, readonly DashboardItemId[]> = {
  identity: [
    "feature_soaps",
    "feature_pray",
    "feature_scripture_memory",
    "feature_share",
    "feature_chat",
    "feature_thirds",
    "feature_discipleship_momentum",
  ],
  daily: [
    "feature_soaps",
    "feature_pray",
    "feature_share",
    "feature_scripture_memory",
    "feature_chat",
    "feature_thirds",
  ],
  community: ["feature_thirds"],
  multiplication: ["growth_transformed_person", "growth_mawl", "growth_pathway"],
};

export function migrateLegacyModulesToItems(modules: DashboardModuleId[]): DashboardItemId[] {
  const seen = new Set<DashboardItemId>();
  const out: DashboardItemId[] = [];
  const order: DashboardModuleId[] = ["identity", "daily", "community", "multiplication"];
  for (const mod of order) {
    if (!modules.includes(mod)) continue;
    for (const id of LEGACY_MODULE_ITEMS[mod]) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return DASHBOARD_ITEM_IDS.filter((id) => seen.has(id));
}

/**
 * Resolve ordered item ids for custom mode: `custom_dashboard_items` (with legacy token mapping),
 * else migrate legacy `custom_dashboard_modules`, else [].
 */
export function resolveCustomDashboardItemIds(
  mode: AppExperienceMode | null,
  rawItems: unknown,
  rawModules: unknown
): DashboardItemId[] {
  if (mode !== "custom") return [];
  const fromItems = parseCustomDashboardItems(rawItems);
  if (fromItems.length > 0) return fromItems;
  const legacyMods = parseCustomDashboardModules(rawModules);
  if (legacyMods.length > 0) return migrateLegacyModulesToItems(legacyMods);
  return [];
}
