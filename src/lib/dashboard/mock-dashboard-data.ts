/**
 * Placeholder view models for the dashboard shell (no backend yet).
 */

export const mockIdentityCore = {
  stats: [
    { label: "This week", value: "3 entries" },
    { label: "Reading streak", value: "5 days" },
    { label: "Groups", value: "2 active" },
    { label: "Prayer list", value: "4 people" },
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
    title: "CHAT" as const,
    description: "Accountability group meeting hub.",
    statusLabel: "Next: Thu 7pm",
    href: "/app/chat",
    theme: "chat" as const,
  },
] as const;

export const mockCommunityNodes = [
  {
    title: "My 3/3 Family",
    description: "Your 3/3rds groups and meetings.",
    countLabel: "2 groups",
    href: "/app/groups",
  },
  {
    title: "New 3/3",
    description: "Start a new 3/3rds workspace.",
    href: "/app/groups/new",
  },
  {
    title: "Model/Assist",
    description: "Help others learn the rhythm.",
    href: "/app/assist",
  },
] as const;

export const mockJourneyNodes = [
  {
    title: "Watch Phase",
    description: "Observe how God is forming you and others.",
    statusLabel: "In progress",
    progressLabel: "Week 3 of 8",
    href: "/app/growth/watch",
  },
  {
    title: "Transformed Person",
    description: "Fruit, habits, and next faithful steps.",
    statusLabel: "Reflect",
    href: "/app/growth",
  },
] as const;

export const mockInsightTiles = [
  {
    title: "Continue reading",
    value: "John 15",
    supportingText: "Pick up where you left off",
    href: "/app/read",
    variant: "default" as const,
  },
  {
    title: "Journal",
    value: "1 draft",
    supportingText: "Finish your latest entry",
    href: "/app/journal",
    variant: "default" as const,
  },
  {
    title: "CHAT this week",
    value: "Agenda ready",
    supportingText: "Accountability questions",
    href: "/app/chat",
    variant: "success" as const,
  },
  {
    title: "Insights",
    value: "Themes updated",
    supportingText: "Review your patterns",
    href: "/app/insights",
    variant: "default" as const,
  },
] as const;

export const mockQuickActions = [
  { label: "Read", href: "/app/read" },
  { label: "Journal", href: "/app/journal" },
  { label: "SOAPS", href: "/app/soaps" },
  { label: "CHAT", href: "/app/chat" },
] as const;
