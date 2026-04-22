/**
 * Format a pillar-week Monday (YYYY-MM-DD) for user-facing copy.
 * Uses a fixed calendar interpretation so the label matches stored week boundaries.
 */
export function formatParticipationWeekLong(ymd: string): string {
  try {
    const d = new Date(`${ymd}T12:00:00.000Z`);
    return d.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return ymd;
  }
}
