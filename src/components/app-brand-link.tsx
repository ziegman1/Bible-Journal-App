"use client";

import Link from "next/link";
import { BadwrLogo } from "@/components/badwr-logo";
import { cn } from "@/lib/utils";

/** Sidebar / sheet header: logo + BADWR + tagline */
export function AppBrandLink({
  href = "/app",
  onNavigate,
  className,
}: {
  href?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
        className
      )}
    >
      <BadwrLogo variant="compact" className="mt-0.5" />
      <span className="min-w-0 text-left">
        <span className="font-serif text-lg font-light text-stone-800 dark:text-stone-200 leading-tight block">
          BADWR
        </span>
        <span className="mt-1 block text-[0.7rem] sm:text-xs font-sans font-normal leading-snug text-stone-500 dark:text-stone-400">
          Be a Disciple Worth Reproducing
        </span>
      </span>
    </Link>
  );
}
