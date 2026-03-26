/**
 * Process map node positions (percent of container: 0–100).
 * Tweak x/y here; nodes are centered at each point via translate(-50%, -50%).
 *
 * `size` is the node diameter in px — controls visual hierarchy.
 */

export type ProcessNodeType =
  | "identity"
  | "practice"
  | "chat"
  | "community"
  | "watch"
  | "model"
  | "transformed"
  | "new33";

export type ProcessMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  href: string;
  /** Diameter in px. Scales down on small screens via clamp(). */
  size: number;
  /** Visual type — drives color, glow, and border treatment */
  type: ProcessNodeType;
  /** Child / satellite nodes (e.g. t_*) render smaller and lighter. Also auto-detected from `t_` id prefix. */
  child?: boolean;
};

export const PROCESS_NODES: ProcessMapNode[] = [
  { id: "me",          label: "Me / BADWR",          x: 24, y: 40, href: "/app",              size: 112, type: "identity"    },

  { id: "soap",        label: "SOAP",                x: 9,  y: 15, href: "/app/soaps",        size: 61,  type: "practice"    },
  { id: "pray",        label: "PRAY",                x: 24, y: 11, href: "/app/prayer",       size: 61,  type: "practice"    },
  { id: "share",       label: "SHARE",               x: 39, y: 15, href: "/app/share",        size: 61,  type: "practice"    },

  { id: "chat",        label: "CHAT",                x: 6,  y: 39, href: "/app/chat",         size: 61,  type: "chat"        },

  { id: "family",      label: "My 3/3 Family",       x: 15, y: 83, href: "/app/groups",       size: 100, type: "community"   },

  { id: "watch",       label: "Watch Phase",          x: 46, y: 74, href: "/app/growth/watch", size: 110, type: "watch"       },

  { id: "model",       label: "Model / Assist",       x: 53, y: 42, href: "/app/assist",       size: 110, type: "model"       },

  { id: "transformed", label: "Transformed Person",   x: 80, y: 55, href: "/app/growth",       size: 105, type: "transformed" },

  { id: "t_soap",     label: "SOAPS",               x: 93, y: 43, href: "/app/soaps",        size: 40,  type: "practice",    child: true },
  { id: "t_share",    label: "SHARE",               x: 96, y: 56, href: "/app/share",        size: 44,  type: "practice",    child: true },
  { id: "t_chat",     label: "CHAT",                x: 91, y: 71, href: "/app/chat",         size: 38,  type: "chat",        child: true },
  { id: "t_pray",     label: "PRAY",                x: 81, y: 78, href: "/app/prayer",       size: 38,  type: "practice",    child: true },

  { id: "new33",       label: "New 3/3",              x: 70, y: 88, href: "/app/groups/new",   size: 86,  type: "new33"       },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  Annotations — small contextual labels anchored to nodes
 *
 *  type:
 *    "plaque"  — metallic tag beneath / beside a node (rhythm/frequency)
 *    "callout" — compact rectangular aside (descriptive text)
 *    "caption" — low-emphasis line near a cluster
 *
 *  offsetX / offsetY are in %-of-container, added to the node's (x, y).
 * ═══════════════════════════════════════════════════════════════════════════ */

export type AnnotationType = "plaque" | "callout" | "caption";

export type NodeAnnotation = {
  text: string;
  type: AnnotationType;
  offsetX?: number;
  offsetY?: number;
};

export const NODE_ANNOTATIONS: Record<string, NodeAnnotation[]> = {
  soap: [
    { text: "DAILY", type: "plaque", offsetY: 7 },
  ],
  pray: [
    { text: "DAILY", type: "plaque", offsetY: 7 },
  ],
  chat: [
    { text: "1 Hour/Wk", type: "plaque", offsetY: 6 },
  ],
  family: [
    { text: "3 Hour/Wk", type: "plaque", offsetY: 9 },
  ],
  watch: [],
};

export type MapCaption = {
  text: string;
  x: number;
  y: number;
};

export const MAP_CAPTIONS: MapCaption[] = [
  { text: "Others in my 3/3 starting M/A groups", x: 15, y: 97 },
];

/** Connection segments [fromId, toId] — same coordinate space as nodes (0–100). */
export const PROCESS_MAP_EDGES: [string, string][] = [
  ["me", "soap"],
  ["me", "pray"],
  ["me", "share"],
  ["me", "chat"],
  ["me", "watch"],
  ["transformed", "watch"],
  ["transformed", "new33"],
  ["me", "model"],
  ["model", "transformed"],
  ["me", "family"],
  ["transformed", "t_soap"],
  ["transformed", "t_share"],
  ["transformed", "t_chat"],
  ["transformed", "t_pray"],
];
