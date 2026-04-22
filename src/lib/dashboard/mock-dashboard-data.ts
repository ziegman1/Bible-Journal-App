/**
 * Placeholder view models for the dashboard shell (no backend yet).
 */

export const mockIdentityCore = {
  stats: [
    { label: "SOAPS streak", value: "0 days" },
    { label: "Prayer streak", value: "0 days" },
    { label: "Share streak", value: "0 days" },
    { label: "Scripture Memory streak", value: "0 days" },
    { label: "3/3 weekly streak", value: "0 weeks" },
    { label: "CHAT weekly streak", value: "0 weeks" },
  ],
} as const;

export const mockPracticeNodes = [
  {
    title: "SOAPS" as const,
    description: "Scripture, observation, application, prayer, share.",
    statusLabel: "Ready",
    secondaryMeta: "Last: yesterday",
    href: "/app/soaps",
    theme: "soap" as const,
  },
  {
    title: "PRAY" as const,
    description: "Prayer list and focused time.",
    statusLabel: "2 due today",
    href: "/app/prayer",
    theme: "pray" as const,
  },
  {
    title: "SHARE" as const,
    description: "Share insights and invitations.",
    statusLabel: "Open",
    href: "/app/share",
    theme: "share" as const,
  },
  {
    title: "SCRIPTURE" as const,
    description: "Memorize and review passages.",
    statusLabel: "Open",
    href: "/app/scripture-memory",
    theme: "memory" as const,
  },
  {
    title: "CHAT" as const,
    description: "Accountability group meeting hub.",
    statusLabel: "Next: Thu 7pm",
    href: "/app/chat",
    theme: "chat" as const,
  },
  {
    title: "3/3rds" as const,
    description: "Weekly meeting rhythm.",
    statusLabel: "Open",
    href: "/app/groups",
    theme: "thirds" as const,
  },
] as const;

export const mockCommunityNodes = [
  {
    title: "3/3rds Family",
    description: "Your 3/3rds groups and meetings.",
    countLabel: "2 groups",
    href: "/app/groups/family",
  },
] as const;

/** Pathway links only (no legacy %-metrics here — home momentum is `FormationMomentumCard`). */
export const mockMultiplicationNodes = [
  {
    title: "Transformed Person",
    description: "Fruit, habits, and next faithful steps.",
    statusLabel: "Reflect",
    href: "/app/growth",
  },
  {
    title: "MAWL",
    description: "Model, Assist, Watch, Lead—multiply helpers of others.",
    statusLabel: "Open",
    href: "/app/assist",
  },
  {
    title: "Pathway",
    description: "Discipleship pathway and next steps.",
    statusLabel: "Explore",
    href: "/app/pathway",
  },
] as const;
