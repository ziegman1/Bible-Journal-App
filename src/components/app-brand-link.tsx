"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Sidebar / sheet header: BADWR + tagline */
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
      className={cn("block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}
    >
      <span className="font-serif text-lg font-light text-stone-800 dark:text-stone-200 leading-tight block">
        BADWR
      </span>
      <span className="mt-1 block text-[0.7rem] sm:text-xs font-sans font-normal leading-snug text-stone-500 dark:text-stone-400">
        Be a Disciple Worth Reproducing
      </span>
    </Link>
  );
}
