"use client";

import Image from "next/image";
import { APP_LOGO_ALT, APP_LOGO_PATH } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Source asset dimensions (fixed ratio for `next/image`). */
const LOGO_WIDTH = 1200;
const LOGO_HEIGHT = 630;

const VARIANT_CLASS = {
  /** Landing hero — readable slogan, mobile-first. */
  hero: "h-20 w-auto max-w-[min(100%,22rem)] sm:h-28 sm:max-w-xl md:h-32",
  /** Auth and similar centered stacks. */
  auth: "h-16 w-auto max-w-[min(100%,18rem)] sm:h-20 sm:max-w-md",
  /** Sidebar / legal header next to wordmark. */
  compact: "h-9 w-auto max-w-[5.5rem] shrink-0 sm:h-10 sm:max-w-[6.25rem]",
  /** Dense chrome (e.g. mobile app bar). */
  micro: "h-7 w-auto max-w-[4.5rem] shrink-0 sm:h-8 sm:max-w-[5.25rem]",
  /** Footer — subtle but recognizable. */
  footer: "h-8 w-auto max-w-[8rem] shrink-0 opacity-95 sm:h-9 sm:max-w-[9rem]",
} as const;

export type BadwrLogoVariant = keyof typeof VARIANT_CLASS;

export function BadwrLogo({
  variant = "auth",
  className,
  priority = false,
}: {
  variant?: BadwrLogoVariant;
  className?: string;
  /** Set on LCP / above-the-fold heroes. */
  priority?: boolean;
}) {
  return (
    <Image
      src={APP_LOGO_PATH}
      alt={APP_LOGO_ALT}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn(VARIANT_CLASS[variant], "object-contain object-center", className)}
      priority={priority}
    />
  );
}
