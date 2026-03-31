"use client";

import Image from "next/image";
import {
  APP_LOGO_ALT,
  APP_LOGO_PATH_DARK,
  APP_LOGO_PATH_LIGHT,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Source asset dimensions — square UI logos (light PNG and dark JPEG are both 1024×1024). */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 1024;

const VARIANT_CLASS = {
  /** Landing hero */
  hero: "h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40",
  /** Login, signup, onboarding */
  auth: "h-24 w-24 sm:h-28 sm:w-28",
  /** Sidebar / legal header */
  compact: "h-10 w-10 shrink-0 sm:h-11 sm:w-11",
  /** Mobile app bar */
  micro: "h-8 w-8 shrink-0 sm:h-9 sm:w-9",
  /** Footer */
  footer: "h-9 w-9 shrink-0 opacity-95 sm:h-10 sm:w-10",
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
  const base = cn(
    VARIANT_CLASS[variant],
    "object-contain object-center",
    className,
  );

  return (
    <span className="inline-flex shrink-0">
      <Image
        src={APP_LOGO_PATH_LIGHT}
        alt={APP_LOGO_ALT}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={cn(base, "badwr-logo-light")}
        priority={priority}
      />
      <Image
        src={APP_LOGO_PATH_DARK}
        alt={APP_LOGO_ALT}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={cn(base, "badwr-logo-dark")}
        priority={priority}
      />
    </span>
  );
}
