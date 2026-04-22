import { GEN_MAP_HEALTH_ICON_COUNT } from "./health-icons";
import type { GenMapNodeMetrics, GenMapTreeNode } from "./types";

export function normalizeHealthIconToggles(raw: unknown): boolean[] {
  const out = Array.from({ length: GEN_MAP_HEALTH_ICON_COUNT }, () => false);
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < GEN_MAP_HEALTH_ICON_COUNT; i++) {
    out[i] = raw[i] === true;
  }
  return out;
}

export function findNodeById(root: GenMapTreeNode, id: string): GenMapTreeNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    const hit = findNodeById(c, id);
    if (hit) return hit;
  }
  return null;
}

export type GenMapNodePatch = {
  name?: string;
  generation?: number;
  peopleGroup?: string;
  country?: string;
  metrics?: Partial<GenMapNodeMetrics>;
  healthIconToggles?: boolean[];
  active?: boolean;
  newGeneration?: boolean;
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
};

export function updateNodeById(
  root: GenMapTreeNode,
  id: string,
  patch: GenMapNodePatch
): GenMapTreeNode {
  if (root.id === id) {
    return {
      ...root,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.generation !== undefined ? { generation: patch.generation } : {}),
      ...(patch.peopleGroup !== undefined ? { peopleGroup: patch.peopleGroup } : {}),
      ...(patch.country !== undefined ? { country: patch.country } : {}),
      ...(patch.healthIconToggles !== undefined
        ? { healthIconToggles: normalizeHealthIconToggles(patch.healthIconToggles) }
        : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      ...(patch.newGeneration !== undefined ? { newGeneration: patch.newGeneration } : {}),
      ...(patch.leaderName !== undefined ? { leaderName: patch.leaderName } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.dateOfStart !== undefined ? { dateOfStart: patch.dateOfStart } : {}),
      ...(patch.place !== undefined ? { place: patch.place } : {}),
      ...(patch.geoLocation !== undefined ? { geoLocation: patch.geoLocation } : {}),
      ...(patch.gospelSharesPerDay !== undefined ? { gospelSharesPerDay: patch.gospelSharesPerDay } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {}),
      ...(patch.isChurch !== undefined ? { isChurch: patch.isChurch } : {}),
      ...(patch.churchType !== undefined ? { churchType: patch.churchType } : {}),
      ...(patch.elementsProcess !== undefined ? { elementsProcess: patch.elementsProcess } : {}),
      metrics:
        patch.metrics != null ? { ...root.metrics, ...patch.metrics } : root.metrics,
      children: root.children,
    };
  }
  return {
    ...root,
    children: root.children.map((c) => updateNodeById(c, id, patch)),
  };
}

function isMetrics(v: unknown): v is GenMapNodeMetrics {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.attendees === "number" &&
    typeof m.believers === "number" &&
    typeof m.baptized === "number" &&
    typeof m.newBaptized === "number"
  );
}

function parseNode(raw: unknown): GenMapTreeNode | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  if (typeof n.id !== "string" || typeof n.name !== "string" || typeof n.generation !== "number") {
    return null;
  }
  if (!isMetrics(n.metrics)) return null;
  const peopleGroup = typeof n.peopleGroup === "string" ? n.peopleGroup : "Unknown";
  const country = typeof n.country === "string" ? n.country : "";
  if (!Array.isArray(n.children)) return null;
  const children: GenMapTreeNode[] = [];
  for (const c of n.children) {
    const parsed = parseNode(c);
    if (parsed) children.push(parsed);
  }
  const gospelSharesPerDay =
    typeof n.gospelSharesPerDay === "number" && Number.isFinite(n.gospelSharesPerDay)
      ? Math.min(99999, Math.max(0, Math.floor(n.gospelSharesPerDay)))
      : undefined;

  return {
    id: n.id,
    name: n.name,
    generation: n.generation,
    metrics: { ...n.metrics },
    peopleGroup,
    country,
    active: typeof n.active === "boolean" ? n.active : undefined,
    newGeneration: typeof n.newGeneration === "boolean" ? n.newGeneration : undefined,
    leaderName: typeof n.leaderName === "string" ? n.leaderName : undefined,
    email: typeof n.email === "string" ? n.email : undefined,
    dateOfStart: typeof n.dateOfStart === "string" ? n.dateOfStart : undefined,
    place: typeof n.place === "string" ? n.place : undefined,
    geoLocation: typeof n.geoLocation === "string" ? n.geoLocation : undefined,
    gospelSharesPerDay,
    note: typeof n.note === "string" ? n.note : undefined,
    isChurch: typeof n.isChurch === "boolean" ? n.isChurch : undefined,
    churchType: typeof n.churchType === "string" ? n.churchType : undefined,
    elementsProcess: typeof n.elementsProcess === "string" ? n.elementsProcess : undefined,
    healthIconToggles: normalizeHealthIconToggles(n.healthIconToggles),
    children,
  };
}

export function parseGenMapTree(raw: unknown): GenMapTreeNode | null {
  return parseNode(raw);
}
