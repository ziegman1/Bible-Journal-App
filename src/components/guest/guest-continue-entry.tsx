"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startGuestBrowserSession } from "@/lib/guest/guest-mode.client";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "secondary";

export function GuestContinueEntry({
  className,
  variant = "secondary",
  fullWidth,
  size = "default",
}: {
  className?: string;
  variant?: Variant;
  fullWidth?: boolean;
  size?: "default" | "lg";
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(fullWidth && "w-full", className)}
      onClick={() => {
        startGuestBrowserSession();
        router.replace("/app");
      }}
    >
      Continue as Guest
    </Button>
  );
}
