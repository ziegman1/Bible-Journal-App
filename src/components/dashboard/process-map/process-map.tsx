"use client";

import { cn } from "@/lib/utils";
import {
  PROCESS_MAP_CONNECTIONS,
  PROCESS_MAP_NODES,
} from "./process-map-config";
import { ProcessMapConnections } from "./process-map-connections";
import { ProcessNode } from "./process-node";

/**
 * Spatial process map.
 *
 * - Container: relative, aspect-ratio locked (3:2), max-width 1200px.
 * - Nodes: absolutely positioned via percentage x/y from config.
 * - Connections: SVG overlay in same coordinate space.
 * - Scales proportionally; never reflows to list.
 */
export function ProcessMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
      style={{ aspectRatio: "3 / 2" }}
    >
      {/* Faint radial glow behind center */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-15"
        style={{
          background:
            "radial-gradient(ellipse 45% 50% at 45% 45%, rgba(129,140,248,0.12), transparent 70%)",
        }}
      />

      {/* SVG connection lines (behind nodes) */}
      <ProcessMapConnections
        nodes={PROCESS_MAP_NODES}
        connections={PROCESS_MAP_CONNECTIONS}
      />

      {/* Nodes */}
      {PROCESS_MAP_NODES.map((node) => (
        <ProcessNode
          key={node.id}
          id={node.id}
          label={node.label}
          subtitle={node.subtitle}
          x={node.x}
          y={node.y}
          type={node.type}
          href={node.href}
          size={node.size}
        />
      ))}
    </div>
  );
}
