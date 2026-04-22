"use client";

import { GenMapHealthIconGrid, isGenMapIconCellTarget } from "./gen-map-health-icon-grid";
import { nodeDisplayName, type GenMapTreeNode } from "@/lib/gen-map/types";
import { cn } from "@/lib/utils";
import { Crown, Droplets, Smile } from "lucide-react";
import * as React from "react";

type Props = {
  node: GenMapTreeNode;
  selected: boolean;
  onSelect: () => void;
  onToggleHealthIcon: (iconIndex: number) => void;
  /** Gen 0 uses larger emphasis */
  isRoot?: boolean;
};

export function GenMapNodeCircle({
  node,
  selected,
  onSelect,
  onToggleHealthIcon,
  isRoot,
}: Props) {
  const { metrics } = node;
  const label = nodeDisplayName(node);
  const density = isRoot ? "root" : "child";
  const circleSize = isRoot
    ? "h-[11.25rem] w-[11.25rem] min-h-[11.25rem] min-w-[11.25rem] sm:h-[13.25rem] sm:w-[13.25rem] sm:min-h-[13.25rem] sm:min-w-[13.25rem]"
    : "h-[8.75rem] w-[8.75rem] min-h-[8.75rem] min-w-[8.75rem] sm:h-[9.75rem] sm:w-[9.75rem] sm:min-h-[9.75rem] sm:min-w-[9.75rem]";
  const textClass = isRoot ? "text-sm sm:text-base" : "text-xs sm:text-sm";

  const handleCircleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGenMapIconCellTarget(e.target)) return;
    onSelect();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Metrics strip above node */}
      <div
        className="flex items-center gap-3 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm tabular-nums backdrop-blur-sm sm:text-sm"
        aria-label="Node metrics"
      >
        <span className="inline-flex items-center gap-1" title="Attendees">
          <Smile className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          {metrics.attendees}
        </span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span className="inline-flex items-center gap-1" title="Believers">
          <Crown className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          {metrics.believers}
        </span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span className="inline-flex items-center gap-1" title="Baptized">
          <Droplets className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
          {metrics.baptized}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div
          data-gen-map-node-circle=""
          onClick={handleCircleClick}
          data-selected={selected ? "true" : "false"}
          aria-label={`${label}, generation ${node.generation}. Click outside the icons to select this node; click an icon to toggle it.`}
          className={cn(
            "flex cursor-default flex-col items-stretch justify-center rounded-full border-2 border-dashed border-foreground/80 bg-sky-100/65 text-foreground shadow-inner transition-[box-shadow,background-color] outline-none select-none dark:border-foreground/50 dark:bg-sky-950/35",
            "hover:bg-sky-100/85 dark:hover:bg-sky-950/45",
            circleSize,
            isRoot
              ? "border-primary/70 ring-1 ring-primary/15"
              : "border-foreground/75 ring-0 dark:border-foreground/55",
            selected &&
              "border-primary bg-sky-100/80 ring-2 ring-primary/30 dark:bg-sky-950/45"
          )}
        >
          <GenMapHealthIconGrid
            toggles={node.healthIconToggles}
            onToggle={onToggleHealthIcon}
            density={density}
          />
        </div>
        <button
          type="button"
          onClick={() => onSelect()}
          className={cn(
            "max-w-[14rem] cursor-pointer text-center font-medium leading-snug text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            textClass
          )}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
