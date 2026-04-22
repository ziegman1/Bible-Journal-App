/**
 * Gen Map — church / 3/3rds–family multiplication tree.
 * Gen 0 is the hub (“My 3/3rds Family”), not an individual contact.
 */

import { GEN_MAP_HEALTH_ICON_COUNT } from "./health-icons";

export type GenMapNodeMetrics = {
  attendees: number;
  believers: number;
  baptized: number;
  /** New baptisms since church start */
  newBaptized: number;
};

export type GenMapTreeNode = {
  id: string;
  name: string;
  generation: number;
  metrics: GenMapNodeMetrics;
  /** Local people-group / gathering label */
  peopleGroup: string;
  country: string;
  /** Info sidebar — lifecycle flags */
  active?: boolean;
  newGeneration?: boolean;
  /** Info sidebar — contact & place (optional; omitted in older saved trees) */
  leaderName?: string;
  email?: string;
  dateOfStart?: string;
  place?: string;
  geoLocation?: string;
  gospelSharesPerDay?: number;
  note?: string;
  isChurch?: boolean;
  churchType?: string;
  elementsProcess?: string;
  /**
   * 12 church-health / disciple-making toggles (row-major 3×4 grid inside the node).
   * Omitted or wrong length is normalized on load.
   */
  healthIconToggles?: boolean[];
  children: GenMapTreeNode[];
};

export const GEN_MAP_ROOT_ID = "gen-0";

export const DEFAULT_GEN_MAP_METRICS: GenMapNodeMetrics = {
  attendees: 0,
  believers: 0,
  baptized: 0,
  newBaptized: 0,
};

export function createDefaultGenMapTree(): GenMapTreeNode {
  return {
    id: GEN_MAP_ROOT_ID,
    name: "My 3/3rds Family",
    generation: 0,
    metrics: { ...DEFAULT_GEN_MAP_METRICS },
    peopleGroup: "Unknown",
    country: "",
    healthIconToggles: Array.from({ length: GEN_MAP_HEALTH_ICON_COUNT }, () => false),
    children: [],
  };
}

/**
 * Label for the node circle and Info “Name”: matches people group when it is set;
 * Gen 0 falls back to the default hub title when group is unknown.
 */
export function nodeDisplayName(node: GenMapTreeNode): string {
  const pg = node.peopleGroup?.trim();
  if (pg && pg !== "Unknown") return pg;
  if (node.generation === 0) return "My 3/3rds Family";
  const n = node.name?.trim();
  if (n) return n;
  return `Gen ${node.generation}`;
}

/** Rewrites each node’s `name` so it stays aligned with `peopleGroup` / generation rules. */
export function syncNodeTreeNames(root: GenMapTreeNode): GenMapTreeNode {
  return {
    ...root,
    name: nodeDisplayName(root),
    children: root.children.map(syncNodeTreeNames),
  };
}
