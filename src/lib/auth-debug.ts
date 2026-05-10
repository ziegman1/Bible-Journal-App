/**
 * Structured auth diagnostics — no tokens, passwords, or cookie values.
 * Safe for production logs (support / device debugging).
 */
export type AuthDebugMeta = Record<string, string | number | boolean | undefined>;

const PREFIX = "[badwr:auth]";

export function authLog(event: string, meta?: AuthDebugMeta): void {
  const line = {
    event,
    t: Date.now(),
    ...meta,
  };
  if (process.env.NODE_ENV === "development") {
    console.info(PREFIX, line);
  } else {
    console.info(PREFIX, JSON.stringify(line));
  }
}
