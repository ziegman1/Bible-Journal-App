"use client";

import Link from "next/link";
import { BadwrLogo } from "@/components/badwr-logo";
import { APP_NAME } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Sidebar / sheet header: brand logo link */
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
      aria-label={`${APP_NAME} home`}
      className={cn(
        "inline-flex items-center min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
        className
      )}
    >
      <BadwrLogo variant="compact" />
    </Link>
  );
}
