"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SOAPS_HUB_RELATED, SOAPS_JOURNAL_HREF } from "@/lib/nav/soaps-hub";
import { cn } from "@/lib/utils";

const dropdownItemClass =
  "block rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800";

/**
 * Home: SOAPS entry with hover flyout (md+) and always-visible chips on small screens.
 */
export function HomeSoapsDropdown({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4", className)}>
      <div className="relative inline-flex w-fit flex-col gap-1">
        <div className="group relative inline-flex flex-col items-start">
          <div className="flex items-center gap-1.5">
            <Link
              href={SOAPS_JOURNAL_HREF}
              className="text-base font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-100"
            >
              SOAPS
            </Link>
            <ChevronDown
              className="size-4 shrink-0 text-stone-500 opacity-70 sm:group-hover:rotate-180 sm:transition-transform"
              aria-hidden
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 sm:sr-only">
            Journal & related tools
          </p>
          {/* Hover / focus-within panel — desktop; pt-1 bridges gap so menu stays open */}
          <div
            className={cn(
              "z-30 hidden min-w-[12rem] sm:absolute sm:left-0 sm:top-full sm:block sm:pt-1",
              "sm:opacity-0 sm:invisible sm:transition-all",
              "sm:pointer-events-none sm:group-hover:pointer-events-auto sm:focus-within:pointer-events-auto",
              "sm:group-hover:visible sm:group-hover:opacity-100 sm:focus-within:visible sm:focus-within:opacity-100"
            )}
          >
            <div className="rounded-lg border border-stone-200 bg-background py-1 shadow-md dark:border-stone-700">
              <Link href={SOAPS_JOURNAL_HREF} className={dropdownItemClass}>
                SOAPS journal
              </Link>
              {SOAPS_HUB_RELATED.map((item) => (
                <Link key={item.href} href={item.href} className={dropdownItemClass}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile / coarse pointer: show links inline */}
      <div className="flex flex-wrap gap-2 sm:hidden">
        {SOAPS_HUB_RELATED.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-xs rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-stone-600 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-400"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
