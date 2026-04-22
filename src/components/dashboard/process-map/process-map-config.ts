/**
 * Spatial node configuration for the BADWR pathway process map.
 *
 * HOW TO TWEAK POSITIONS:
 *   - x/y are percentages of the map container (0 = left/top, 100 = right/bottom).
 *   - Each node is centered at its (x, y) via translate(-50%, -50%).
 *   - Adjust x/y in 1–2% increments. Preview at /app/pathway.
 *   - Connections reference node ids — they auto-follow position changes.
 */

export type ProcessNodeType = "identity" | "practice" | "community" | "growth";

export type ProcessNodeConfig = {
  id: string;
  label: string;
  /** Optional second line rendered below label */
  subtitle?: string;
  x: number;
  y: number;
  type: ProcessNodeType;
  href: string;
  /** Affects size. lg = identity core, md = primary nodes, sm = satellite nodes */
  size?: "sm" | "md" | "lg";
};

export type ProcessConnectionConfig = {
  from: string;
  to: string;
  /** "solid" for primary flow, "dashed" for secondary relationships */
  style?: "solid" | "dashed";
};

// ─── Nodes ───────────────────────────────────────────────────────────────────

export const PROCESS_MAP_NODES: ProcessNodeConfig[] = [
  // Identity core
  { id: "me",          label: "Me / BADWR",         x: 45, y: 45, type: "identity",  href: "/app",              size: "lg" },

  // Daily practice ring
  { id: "soap",        label: "SOAPS",              x: 30, y: 15, type: "practice",  href: "/app/soaps",        size: "md" },
  { id: "pray",        label: "PRAY",               x: 45, y: 12, type: "practice",  href: "/app/prayer",       size: "md" },
  { id: "share",       label: "SHARE",              x: 60, y: 15, type: "practice",  href: "/app/share",        size: "md" },

  // Accountability
  { id: "chat",        label: "CHAT",               x: 25, y: 40, type: "practice",  href: "/app/chat",         size: "md" },

  // Community
  { id: "family",      label: "My 3/3 Family",      x: 25, y: 70, type: "community", href: "/app/groups/family", size: "md" },

  // Growth journey
  { id: "watch",       label: "Watch Phase",         x: 46, y: 68, type: "growth",    href: "/app/growth/watch", size: "md" },
  { id: "model",       label: "Model / Assist",      x: 65, y: 40, type: "community", href: "/app/assist",       size: "md" },
  { id: "transformed", label: "Transformed Person",  x: 80, y: 55, type: "growth",    href: "/app/growth",       size: "md" },

  // Multiplication
  { id: "new33",       label: "New 3/3",             x: 80, y: 80, type: "community", href: "/app/groups/new",   size: "md" },
];

// ─── Connections (pathway flow) ──────────────────────────────────────────────

export const PROCESS_MAP_CONNECTIONS: ProcessConnectionConfig[] = [
  // ME → daily practices
  { from: "me",    to: "soap",        style: "solid" },
  { from: "me",    to: "pray",        style: "solid" },
  { from: "me",    to: "chat",        style: "solid" },

  // Daily → outward
  { from: "pray",  to: "share",       style: "solid" },
  { from: "share", to: "model",       style: "solid" },

  // Accountability → community
  { from: "chat",  to: "family",      style: "solid" },

  // Community → growth
  { from: "model", to: "transformed", style: "solid" },
  { from: "family", to: "watch",      style: "dashed" },
  { from: "transformed", to: "watch", style: "dashed" },

  // Multiplication
  { from: "transformed", to: "new33", style: "solid" },

  // Loop back
  { from: "new33", to: "me",          style: "dashed" },
];
