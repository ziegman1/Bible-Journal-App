import "server-only";

import { headers } from "next/headers";
import { GUEST_REQUEST_HEADER } from "@/lib/guest/guest-paths";

/** True when middleware marked this request as a browser guest session (no Supabase user). */
export async function isGuestRequest(): Promise<boolean> {
  const h = await headers();
  return h.get(GUEST_REQUEST_HEADER) === "1";
}

/** Alias for readability in app code — still server-only. */
export async function isGuestMode(): Promise<boolean> {
  return isGuestRequest();
}
