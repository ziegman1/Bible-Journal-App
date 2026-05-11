export const ADMIN_SANDBOX_THIRDS_GROUP_NAME = "[ADMIN TEST] Sandbox 3/3rds Group";

export type AdminSandboxThirdsScenario =
  | "full"
  | "first_meeting"
  | "active_only"
  | "completed_only"
  | "empty"
  | "partial_draft";

export const ADMIN_SANDBOX_SCENARIO_LABELS: Record<AdminSandboxThirdsScenario, string> = {
  full: "Full mix (completed + active + drafts + partial)",
  first_meeting: "First meeting (single empty draft)",
  active_only: "Active meeting only",
  completed_only: "Completed meeting only",
  empty: "No meetings (empty state)",
  partial_draft: "Partially filled draft",
};

/** UI-only personas — not real group_members rows. */
export const ADMIN_SANDBOX_MOCK_MEMBERS: {
  name: string;
  archetype: string;
  note: string;
}[] = [
  {
    name: "You (signed-in admin)",
    archetype: "Facilitator",
    note: "Real account — only live member in the DB for this sandbox.",
  },
  {
    name: "Nina Newfaith",
    archetype: "New believer",
    note: "Simulated — use for mental walkthroughs.",
  },
  {
    name: "Greg Growingway",
    archetype: "Growing disciple",
    note: "Simulated.",
  },
  {
    name: "Quinn Quietdale",
    archetype: "Quiet participant",
    note: "Simulated.",
  },
  {
    name: "Eddie Engagedwell",
    archetype: "Highly engaged participant",
    note: "Simulated.",
  },
];

export type AdminSandboxRolePreview = "facilitator" | "participant" | "presenter";

export function parseSandboxRoleQuery(
  raw: string | string[] | undefined
): AdminSandboxRolePreview | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = v?.trim().toLowerCase();
  if (t === "facilitator" || t === "participant" || t === "presenter") return t;
  return null;
}

export function effectiveGroupRoleForSandboxPreview(args: {
  dbRole: "admin" | "member";
  sandboxGroup: boolean;
  isAdminTester: boolean;
  sandboxRole: AdminSandboxRolePreview | null;
}): "admin" | "member" {
  if (!args.sandboxGroup || !args.isAdminTester) return args.dbRole;
  if (args.sandboxRole === "participant") return "member";
  return args.dbRole;
}
