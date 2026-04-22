"use client";

import { GEN_MAP_HEALTH_ICON_CELLS } from "@/lib/gen-map/health-icons";
import { normalizeHealthIconToggles } from "@/lib/gen-map/tree-utils";
import { cn } from "@/lib/utils";

type Density = "root" | "child";

type Props = {
  toggles: boolean[] | undefined;
  onToggle: (index: number) => void;
  density: Density;
};

export function GenMapHealthIconGrid({ toggles, onToggle, density }: Props) {
  const state = normalizeHealthIconToggles(toggles);

  return (
    <div
      className={cn(
        "grid min-h-0 min-w-0 flex-1 place-items-center",
        "grid-cols-[repeat(4,minmax(0,1fr))] grid-rows-[repeat(3,minmax(0,1fr))]",
        /* Extra inset + slightly narrower track (~10px tighter spacing) so icons sit closer */
        density === "root"
          ? "gap-0 px-5 py-5 sm:px-6 sm:py-6"
          : "gap-0 px-3.5 py-3.5 sm:px-4 sm:py-4"
      )}
    >
      {GEN_MAP_HEALTH_ICON_CELLS.map((cell, i) => {
        const on = state[i] === true;
        return (
          <button
            key={cell.id}
            type="button"
            data-gen-map-icon-cell=""
            aria-label={cell.label}
            aria-pressed={on}
            title={cell.label}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(i);
            }}
            className={cn(
              "flex min-h-0 min-w-0 items-center justify-center rounded-sm outline-none transition-opacity",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
              "h-full w-full",
              density === "root" ? "max-h-[4.5rem] max-w-[4.5rem] sm:max-h-[5.25rem] sm:max-w-[5.25rem]" : "max-h-14 max-w-14 sm:max-h-[4.25rem] sm:max-w-[4.25rem]"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "max-h-full max-w-full shrink-0 text-foreground",
                density === "root" ? "size-9 sm:size-12" : "size-[30px] sm:size-9",
                on ? "opacity-100" : "opacity-[0.22]"
              )}
              aria-hidden
            >
              <use href={`#${cell.id}`} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function isGenMapIconCellTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("[data-gen-map-icon-cell]") != null;
}
