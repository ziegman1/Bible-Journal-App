import { Patrick_Hand } from "next/font/google";
import { cn } from "@/lib/utils";
import { BadwrPathwayIllustratedMap } from "@/components/dashboard/BadwrPathwayIllustratedMap";

/** Re-export for any code that imports routes from this module. */
export { BADWR_PATHWAY_ROUTES } from "@/components/dashboard/badwr-pathway-routes";

const sketchFont = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Pathway map: Image 1 layout + text, Image 2 pastel / illustrated style (SVG). Editable in
 * `BadwrPathwayIllustratedMap.tsx` + `badwr-pathway-illustrated-icons.tsx`.
 */
export function BadwrPathwayMap() {
  return (
    <section
      className={cn(
        sketchFont.className,
        "flex h-[calc(100dvh-3.5rem)] min-h-[200px] w-full max-w-full flex-col overflow-hidden border-b border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      )}
      aria-labelledby="badwr-pathway-heading"
    >
      <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/80 px-2 py-1 text-center dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2
          id="badwr-pathway-heading"
          className="text-sm font-medium leading-tight text-stone-800 dark:text-stone-100 md:text-base"
        >
          Be a Disciple Worth Reproducing — pathway
        </h2>
        <p className="mt-0.5 text-[0.7rem] leading-tight text-stone-600 dark:text-stone-400 md:text-xs">
          Tap the map · ☰ menu
        </p>
        <details className="mt-0.5 text-left text-[0.6rem] text-amber-900/80 dark:text-amber-200/70">
          <summary className="cursor-pointer list-none text-center text-[0.65rem] text-stone-500 underline decoration-dotted dark:text-stone-400">
            Illustrated map (dev)
          </summary>
          <p className="mt-1 px-1 text-center">
            SVG: <code className="rounded bg-stone-200/80 px-1 dark:bg-zinc-800">BadwrPathwayIllustratedMap.tsx</code> (1024×682) · Icons:{" "}
            <code className="rounded bg-stone-200/80 px-1 dark:bg-zinc-800">badwr-pathway-illustrated-icons.tsx</code>
            <br />
            Links: <code className="rounded bg-stone-200/80 px-1 dark:bg-zinc-800">badwr-pathway-routes.ts</code>
          </p>
        </details>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1">
        <BadwrPathwayIllustratedMap />
      </div>
    </section>
  );
}
