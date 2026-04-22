/**
 * Dashboard sections the user can toggle in custom mode.
 * `helpKey` / `tutorialKey` are reserved for future inline help or video overlays.
 */
export type DashboardModuleId = "identity" | "daily" | "community" | "multiplication";

export interface DashboardModuleDefinition {
  id: DashboardModuleId;
  title: string;
  description: string;
  /** Stable key for future CMS or i18n help content */
  helpKey: string;
  /** Stable key for future tutorial / overlay registration */
  tutorialKey: string;
}

export const DASHBOARD_MODULE_DEFINITIONS: readonly DashboardModuleDefinition[] = [
  {
    id: "identity",
    title: "Identity & core rhythm",
    description: "Who you are in Christ and your next SOAPS or reading step.",
    helpKey: "dashboard.identity",
    tutorialKey: "tutorial.dashboard.identity",
  },
  {
    id: "daily",
    title: "Daily practice",
    description: "Streaks, prayer wheel, and day-to-day spiritual habits.",
    helpKey: "dashboard.daily",
    tutorialKey: "tutorial.dashboard.daily",
  },
  {
    id: "community",
    title: "Community ring",
    description: "Groups, chat reading, and relational rhythms.",
    helpKey: "dashboard.community",
    tutorialKey: "tutorial.dashboard.community",
  },
  {
    id: "multiplication",
    title: "Multiplication & reproduction",
    description: "BADWR reproduction and outward-focused growth.",
    helpKey: "dashboard.multiplication",
    tutorialKey: "tutorial.dashboard.multiplication",
  },
] as const;

const ALL_IDS: readonly DashboardModuleId[] = DASHBOARD_MODULE_DEFINITIONS.map((d) => d.id);

export function isDashboardModuleId(value: unknown): value is DashboardModuleId {
  return typeof value === "string" && (ALL_IDS as readonly string[]).includes(value);
}

/** Parse JSON array from DB; invalid entries dropped; preserves order of first occurrence */
export function parseCustomDashboardModules(raw: unknown): DashboardModuleId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DashboardModuleId[] = [];
  for (const item of raw) {
    if (!isDashboardModuleId(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

