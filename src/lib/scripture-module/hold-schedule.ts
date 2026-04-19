export type HoldStatus = "fresh" | "strengthening" | "established";

export type HoldOutcome = "easy" | "okay" | "hard";

/** V1 deterministic scheduling: outcome adjusts state and days until the next review. */
export function nextHoldAfterReview(
  current: HoldStatus,
  outcome: HoldOutcome
): { nextStatus: HoldStatus; intervalDays: number } {
  switch (current) {
    case "fresh":
      if (outcome === "easy") return { nextStatus: "strengthening", intervalDays: 3 };
      return { nextStatus: "fresh", intervalDays: 1 };
    case "strengthening":
      if (outcome === "easy") return { nextStatus: "established", intervalDays: 7 };
      if (outcome === "okay") return { nextStatus: "strengthening", intervalDays: 3 };
      return { nextStatus: "fresh", intervalDays: 1 };
    case "established":
      if (outcome === "hard") return { nextStatus: "strengthening", intervalDays: 3 };
      return { nextStatus: "established", intervalDays: 7 };
    default:
      return { nextStatus: "fresh", intervalDays: 1 };
  }
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function addDaysIso(from: Date, days: number): string {
  return addDays(from, days).toISOString();
}
