/**
 * Navigation / loading diagnostics for production debugging.
 * Enable verbose server logs: BADWR_NAV_DIAG=1
 * Enable verbose client logs + on-screen hints: NEXT_PUBLIC_BADWR_NAV_DIAG=1
 *
 * Never log tokens, cookies, or raw session payloads.
 */
export type NavDiagMeta = Record<string, string | number | boolean | null | undefined>;

const PREFIX = "[badwr:nav]";

export function navDiagServer(event: string, meta?: NavDiagMeta): void {
  if (process.env.BADWR_NAV_DIAG !== "1") return;
  console.info(PREFIX, JSON.stringify({ event, t: Date.now(), ...meta }));
}

/** Logs in all environments when called (use for rare stall/timeout paths only). */
export function navDiagAlways(event: string, meta?: NavDiagMeta): void {
  console.info(PREFIX, JSON.stringify({ event, t: Date.now(), ...meta }));
}

export function navDiagClientVerbose(event: string, meta?: NavDiagMeta): void {
  if (process.env.NEXT_PUBLIC_BADWR_NAV_DIAG !== "1") return;
  console.info(PREFIX, JSON.stringify({ event, t: Date.now(), ...meta }));
}

export function navDiagVerboseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BADWR_NAV_DIAG === "1";
}

/** Wall-clock steps for `src/app/app/layout.tsx` (must not call Date.now in the RSC body for eslint purity). */
let appLayoutDiagT0 = 0;

export function navDiagServerAppLayoutReset(): void {
  if (process.env.BADWR_NAV_DIAG !== "1") return;
  appLayoutDiagT0 = Date.now();
}

export function navDiagServerAppLayoutStep(event: string, meta?: NavDiagMeta): void {
  if (process.env.BADWR_NAV_DIAG !== "1") return;
  const ms = Date.now() - appLayoutDiagT0;
  console.info(PREFIX, JSON.stringify({ event, t: Date.now(), ms, ...meta }));
}
