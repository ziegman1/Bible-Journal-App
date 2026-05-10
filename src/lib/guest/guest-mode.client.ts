"use client";

import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_VALUE,
} from "@/lib/guest/guest-paths";
import {
  GUEST_SESSION_STORAGE_KEY,
  type GuestSessionPayload,
} from "@/lib/guest/guest-session.shared";
import { GUEST_THIRDS_WORKSPACE_STORAGE_KEY } from "@/lib/guest/thirds-personal-guest-persistence";

/** Session cookie (no Max-Age / Expires) — cleared when the browser session ends. */
function guestSessionCookieString(value: string): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `${GUEST_COOKIE_NAME}=${value}; Path=/; SameSite=Lax${secure}`;
}

/** Start guest browsing: HTTP cookie for middleware + sessionStorage metadata. */
export function startGuestBrowserSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = guestSessionCookieString(GUEST_COOKIE_VALUE);
  const payload: GuestSessionPayload = { v: 1, startedAt: new Date().toISOString() };
  try {
    sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode — cookie still allows routing */
  }
}

export function clearGuestBrowserSession(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GUEST_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  try {
    sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(GUEST_THIRDS_WORKSPACE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isGuestBrowserCookiePresent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${GUEST_COOKIE_NAME}=`));
}

export function getGuestSessionPayloadClient(): GuestSessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as GuestSessionPayload;
    if (o?.v === 1 && typeof o.startedAt === "string") return o;
  } catch {
    /* ignore */
  }
  return null;
}
