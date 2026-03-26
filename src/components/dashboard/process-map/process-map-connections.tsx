import type { ProcessConnectionConfig, ProcessNodeConfig } from "./process-map-config";

type Props = {
  nodes: ProcessNodeConfig[];
  connections: ProcessConnectionConfig[];
};

/**
 * SVG overlay drawing curved connections between nodes.
 * Coordinates match the parent container (0–100 viewBox maps to 0%–100% of the container).
 */
export function ProcessMapConnections({ nodes, connections }: Props) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="pm-arrow"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <path
            d="M0,0 L6,2 L0,4"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            className="text-border"
          />
        </marker>
      </defs>

      {connections.map((conn) => {
        const a = nodeMap.get(conn.from);
        const b = nodeMap.get(conn.to);
        if (!a || !b) return null;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;

        // Perpendicular offset for a gentle curve (proportional to distance)
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(dist * 0.15, 6);
        const nx = -dy / (dist || 1);
        const ny = dx / (dist || 1);
        const cx = mx + nx * curvature;
        const cy = my + ny * curvature;

        const isDashed = conn.style === "dashed";

        return (
          <path
            key={`${conn.from}-${conn.to}`}
            d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
            fill="none"
            className="text-border"
            stroke="currentColor"
            strokeWidth="0.25"
            strokeDasharray={isDashed ? "1 0.8" : undefined}
            strokeLinecap="round"
            markerEnd="url(#pm-arrow)"
            opacity={isDashed ? 0.45 : 0.55}
          />
        );
      })}
    </svg>
  );
}
