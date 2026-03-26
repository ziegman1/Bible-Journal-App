import Link from "next/link";
import { SOAPS_HUB_RELATED } from "@/lib/nav/soaps-hub";

/** Horizontal sub-nav on the SOAPS (journal) page for related areas. */
export function SoapsPageSubnav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-stone-200 pb-4 dark:border-stone-800"
      aria-label="SOAPS related pages"
    >
      {SOAPS_HUB_RELATED.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300 dark:hover:bg-stone-800/80"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
