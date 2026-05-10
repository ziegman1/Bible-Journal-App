"use client";

import { useGuestMode } from "@/components/guest/guest-mode-context";

/**
 * Client-side guard: when rendering under {@link GuestModeProvider}, skip server saves
 * and keep edits in component state / sessionStorage only.
 */
export function useGuestSafeSave(): {
  isGuest: boolean;
  guestSaveBlockedMessage: string;
} {
  const isGuest = useGuestMode();
  return {
    isGuest,
    guestSaveBlockedMessage: "Sign in to save your progress to BADWR.",
  };
}
