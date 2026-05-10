/** sessionStorage payload for guest browser label / future migration hints. */
export const GUEST_SESSION_STORAGE_KEY = "badwr_guest_session";

export type GuestSessionPayload = {
  v: 1;
  startedAt: string;
};

export function parseGuestSessionPayload(raw: string | null): GuestSessionPayload | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as GuestSessionPayload;
    if (o?.v === 1 && typeof o.startedAt === "string") return o;
  } catch {
    /* ignore */
  }
  return null;
}
