"use client";

import Link from "next/link";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOAPS_HUB_RELATED,
  SOAPS_JOURNAL_HREF,
} from "@/lib/nav/soaps-hub";

function isRelatedActive(pathname: string, href: string): boolean {
  if (href === "/app/threads") {
    return (
      pathname.startsWith("/app/threads") || pathname.startsWith("/app/thread/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isJournalActive(pathname: string): boolean {
  return (
    pathname === SOAPS_JOURNAL_HREF || pathname.startsWith(`${SOAPS_JOURNAL_HREF}/`)
  );
}

function isSoapsHubRowActive(pathname: string): boolean {
  if (isJournalActive(pathname)) return true;
  return SOAPS_HUB_RELATED.some((item) => isRelatedActive(pathname, item.href));
}

const rowClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2 text-sm transition-colors touch-manipulation",
    active
      ? "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100"
  );

export function SoapsHubSidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="group/soaps relative space-y-0.5">
      <Link
        href={SOAPS_JOURNAL_HREF}
        onClick={onNavigate}
        className={rowClass(isSoapsHubRowActive(pathname))}
        aria-haspopup="true"
      >
        <BookMarked className="size-4 shrink-0" />
        SOAPS
      </Link>
      {/*
        md+: submenu only on hover/focus-within (sidebar has room).
        max-md: drawer — links stay visible (hover flyout is unreliable on touch).
      */}
      <div className="max-md:contents md:absolute md:left-0 md:top-full md:z-30 md:min-w-[11rem] md:pt-1">
        <div
          className={cn(
            "flex flex-col gap-0.5",
            "max-md:ml-2 max-md:border-l max-md:border-stone-200 max-md:py-0.5 max-md:pl-3 dark:max-md:border-stone-700",
            "md:rounded-lg md:border md:border-stone-200 md:bg-stone-50 md:p-1.5 md:shadow-md dark:md:border-stone-700 dark:md:bg-stone-900",
            "max-md:flex",
            "md:hidden md:flex-col md:group-hover/soaps:flex md:group-focus-within/soaps:flex",
            "md:pointer-events-none md:group-hover/soaps:pointer-events-auto md:group-focus-within/soaps:pointer-events-auto"
          )}
          role="group"
          aria-label="SOAPS related"
        >
          {SOAPS_HUB_RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-md px-2 py-2 min-h-10 sm:min-h-0 sm:py-1.5 text-sm transition-colors touch-manipulation",
                isRelatedActive(pathname, item.href)
                  ? "font-medium text-stone-900 dark:text-stone-100"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800/60 dark:hover:text-stone-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
