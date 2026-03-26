/**
 * Structured logs for group invite flow (visible in Vercel / server logs).
 * Never log full invite tokens.
 */
export function logGroupInvite(
  stage: string,
  details: Record<string, unknown> = {}
) {
  const payload = {
    scope: "group_invite",
    stage,
    ts: new Date().toISOString(),
    ...details,
  };
  console.error(JSON.stringify(payload));
}

/** Safe token fingerprint for logs (length + short suffix). */
export function inviteTokenMeta(token: string) {
  const t = token.trim();
  return {
    tokenLength: t.length,
    tokenSuffix: t.length > 4 ? t.slice(-4) : "****",
  };
}
