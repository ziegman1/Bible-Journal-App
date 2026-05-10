/**
 * Guest browser sessions (session cookie `badwr_guest=1`, no Max-Age) may only reach these `/app` paths.
 * Middleware enforces; server layouts use {@link isGuestAllowedAppPath} for parity checks.
 */

function normalizePath(pathname: string): string {
  const p = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  return p === "" ? "/" : p;
}

/**
 * Whether an `/app` pathname is reachable in guest mode (prefix or exact rules).
 */
export function isGuestAllowedAppPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === "/app") return true;

  if (p.startsWith("/app/chat")) {
    if (p.startsWith("/app/chat/groups")) return false;
    return p === "/app/chat" || p.startsWith("/app/chat/");
  }

  const prefixes = [
    "/app/soaps",
    "/app/share",
    "/app/journal",
    "/app/themes",
    "/app/insights",
    "/app/threads",
    "/app/thread",
    "/app/prayer",
    "/app/scripture-memory",
    "/app/read",
    "/app/groups/personal-thirds",
  ] as const;

  for (const prefix of prefixes) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return true;
  }

  return false;
}

export const GUEST_COOKIE_NAME = "badwr_guest";
export const GUEST_COOKIE_VALUE = "1";
export const GUEST_REQUEST_HEADER = "x-badwr-guest";
