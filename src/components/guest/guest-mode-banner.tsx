"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function GuestModeBanner() {
  return (
    <div
      className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-50"
      role="status"
    >
      <span className="text-amber-900/90 dark:text-amber-100/90">
        You&apos;re using BADWR as a guest. Your progress will not be saved.
      </span>{" "}
      <Link
        href="/signup?fromGuest=1"
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "h-auto min-h-8 p-0 text-sm font-semibold text-amber-950 underline-offset-2 dark:text-amber-50"
        )}
      >
        Create account to save your progress
      </Link>
    </div>
  );
}
