"use client";

import {
  GUEST_SESSION_STORAGE_KEY,
  parseGuestSessionPayload,
  type GuestSessionPayload,
} from "@/lib/guest/guest-session.shared";
import { clearGuestBrowserSession, startGuestBrowserSession } from "@/lib/guest/guest-mode.client";

/** Read guest metadata from sessionStorage (browser only). */
export function getGuestSession(): GuestSessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    return parseGuestSessionPayload(sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Clear cookie + sessionStorage guest markers. */
export function clearGuestSession(): void {
  clearGuestBrowserSession();
}

/** Start guest cookie + session payload (same as toolbar “Continue as guest”). */
export function initGuestSession(): void {
  startGuestBrowserSession();
}
