"use client";

import type { GenMapTreeNode } from "@/lib/gen-map/types";
import { GenMapNodeCircle } from "./gen-map-node";
import { cn } from "@/lib/utils";

type Props = {
  node: GenMapTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHealthIcon: (nodeId: string, iconIndex: number) => void;
  isRoot?: boolean;
};

export function GenMapSubtree({ node, selectedId, onSelect, onToggleHealthIcon, isRoot }: Props) {
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn("flex flex-col items-center", hasChildren && "gap-8")}>
      <GenMapNodeCircle
        node={node}
        selected={selectedId === node.id}
        onSelect={() => onSelect(node.id)}
        onToggleHealthIcon={(iconIndex) => onToggleHealthIcon(node.id, iconIndex)}
        isRoot={isRoot}
      />

      {hasChildren ? (
        <div className="relative flex w-full flex-wrap items-start justify-center gap-x-10 gap-y-8 pt-2">
          <div
            className="pointer-events-none absolute top-0 left-1/2 hidden h-px w-[min(80%,24rem)] -translate-x-1/2 border-t border-dashed border-border/80 sm:block"
            aria-hidden
          />
          {node.children.map((child) => (
            <GenMapSubtree
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleHealthIcon={onToggleHealthIcon}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
