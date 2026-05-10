import type { DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import { DASHBOARD_ITEM_IDS } from "@/lib/app-experience-mode/dashboard-items";
import type { JourneyProgressV1 } from "@/lib/app-experience-mode/journey-progress";
import {
  getActiveLinearStep,
  isLinearDiscipleshipPathGraduated,
} from "@/lib/app-experience-mode/linear-discipleship-path";

/**
 * Canonical tool slugs stored in `profiles.journey_progress.unlockedToolIds`
 * and used for gating. Extend with new strings without renaming DB column.
 */
export const GUIDED_JOURNEY_TOOL_IDS = [
  "soaps",
  "prayer",
  "scripture_memory",
  "thirds",
  "share",
  "chat",
  "list_of_100",
] as const;

export type GuidedJourneyToolId = (typeof GUIDED_JOURNEY_TOOL_IDS)[number];

const TOOL_SET = new Set<string>(GUIDED_JOURNEY_TOOL_IDS);

export function isGuidedJourneyToolId(value: unknown): value is GuidedJourneyToolId {
  return typeof value === "string" && TOOL_SET.has(value);
}

/** Cumulative tools available after each phase completes (1-indexed). */
export const GUIDED_JOURNEY_PHASE_TOOLS: readonly (readonly GuidedJourneyToolId[])[] = [
  ["soaps", "prayer"], // phase 1
  ["scripture_memory"], // phase 2
  ["thirds", "share"], // phase 3 — share paired with multiplication rhythm
  ["chat"], // phase 4
  ["list_of_100"], // phase 5
];

export function toolsUnlockedThroughPhase(phase: number): GuidedJourneyToolId[] {
  const p = Math.max(1, Math.min(GUIDED_JOURNEY_PHASE_TOOLS.length, Math.floor(phase)));
  const out = new Set<GuidedJourneyToolId>();
  for (let i = 0; i < p; i++) {
    const slice = GUIDED_JOURNEY_PHASE_TOOLS[i];
    if (!slice) continue;
    for (const t of slice) out.add(t);
  }
  return [...out];
}

/** Merge stored ids + phase defaults; explicit `unlockedToolIds` can extend beyond phase (mentor / manual). */
export function effectiveGuidedJourneyTools(progress: JourneyProgressV1): GuidedJourneyToolId[] {
  const linearPath = progress.linearDiscipleshipPath;
  if (linearPath && !isLinearDiscipleshipPathGraduated(linearPath)) {
    const step = getActiveLinearStep(linearPath);
    if (!step) return [];
    if (step.kind === "lesson") return [];
    if (step.kind === "soaps") return ["soaps"];
  }

  const fromPhase = toolsUnlockedThroughPhase(progress.currentPhase);
  const merged = new Set<GuidedJourneyToolId>(fromPhase);
  for (const raw of progress.unlockedToolIds) {
    if (isGuidedJourneyToolId(raw)) merged.add(raw);
  }
  return [...merged];
}

export function guidedToolToDashboardItemId(tool: GuidedJourneyToolId): DashboardItemId | null {
  switch (tool) {
    case "soaps":
      return "feature_soaps";
    case "prayer":
      return "feature_pray";
    case "scripture_memory":
      return "feature_scripture_memory";
    case "thirds":
      return "feature_thirds";
    case "share":
      return "feature_share";
    case "chat":
      return "feature_chat";
    case "list_of_100":
      return "feature_list_of_100";
    default: {
      const _e: never = tool;
      return _e;
    }
  }
}

/** Dashboard item order when rendering Guided Journey (subset of global rhythm order). */
export function journeyDashboardItemIds(unlocked: readonly GuidedJourneyToolId[]): DashboardItemId[] {
  const ids = new Set<DashboardItemId>();
  for (const t of unlocked) {
    const id = guidedToolToDashboardItemId(t);
    if (id) ids.add(id);
  }
  return DASHBOARD_ITEM_IDS.filter((id) => ids.has(id));
}

/**
 * Routes that are never available in Guided Journey without leaving the mode
 * (discipleship map / custom setup / reproduction extras).
 */
export function isJourneyDeniedPath(pathname: string): boolean {
  if (pathname.startsWith("/app/process-map")) return true;
  if (pathname.startsWith("/app/pathway")) return true;
  if (pathname.startsWith("/app/discipleship-process")) return true;
  if (pathname.startsWith("/app/dashboard-setup")) return true;
  if (pathname.startsWith("/app/growth")) return true;
  if (pathname.startsWith("/app/formation-momentum-inspect")) return true;
  if (pathname.startsWith("/app/assist")) return true;
  return false;
}

/**
 * Which journey tool must be unlocked to access this path segment (first match).
 * Used by per-segment layouts. Returns null when segment is open to all journey users
 * or path is not guarded here (caller decides).
 */
export function guidedJourneyRequiredToolForPathPrefix(pathname: string): GuidedJourneyToolId | "deny" | null {
  if (isJourneyDeniedPath(pathname)) return "deny";
  if (pathname === "/app/journey/invite" || pathname.startsWith("/app/journey/invite/")) return null;
  if (pathname.startsWith("/app/soaps")) return "soaps";
  if (pathname.startsWith("/app/journal")) return "soaps";
  if (pathname.startsWith("/app/read")) return "soaps";
  if (pathname.startsWith("/app/themes")) return "soaps";
  if (pathname.startsWith("/app/insights")) return "soaps";
  if (pathname.startsWith("/app/threads")) return "soaps";
  if (pathname.startsWith("/app/thread/")) return "soaps";
  if (pathname.startsWith("/app/annual-journal")) return "soaps";
  if (pathname.startsWith("/app/prayer")) return "prayer";
  if (pathname.startsWith("/app/scripture-memory")) return "scripture_memory";
  if (pathname.startsWith("/app/share")) return "share";
  if (pathname.startsWith("/app/chat")) return "chat";
  if (pathname.startsWith("/app/groups")) {
    if (/^\/app\/groups\/invite\//.test(pathname)) return null;
    return "thirds";
  }
  if (pathname.startsWith("/app/list-of-100")) return "list_of_100";
  return null;
}
