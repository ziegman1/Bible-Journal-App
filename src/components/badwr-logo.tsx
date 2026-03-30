"use client";

import Image from "next/image";
import { APP_LOGO_ALT, APP_LOGO_PATH } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const VARIANT_PX = {
  hero: { w: 80, h: 80, className: "h-16 w-16 sm:h-20 sm:w-20" },
  auth: { w: 64, h: 64, className: "h-14 w-14 sm:h-16 sm:w-16" },
  compact: { w: 36, h: 36, className: "h-9 w-9 shrink-0" },
  micro: { w: 24, h: 24, className: "h-6 w-6 shrink-0" },
  footer: { w: 28, h: 28, className: "h-7 w-7 shrink-0 opacity-90" },
} as const;

export type BadwrLogoVariant = keyof typeof VARIANT_PX;

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
  const v = VARIANT_PX[variant];
  return (
    <Image
      src={APP_LOGO_PATH}
      alt={APP_LOGO_ALT}
      width={v.w}
      height={v.h}
      className={cn(v.className, "object-contain", className)}
      priority={priority}
    />
  );
}
