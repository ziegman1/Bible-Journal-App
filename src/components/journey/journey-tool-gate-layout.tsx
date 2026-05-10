import { assertGuidedJourneyAccess, type JourneyGateRequirement } from "@/lib/app-experience-mode/journey-access.server";

export async function JourneyToolGateLayout({
  requirement,
  children,
}: {
  requirement: JourneyGateRequirement;
  children: React.ReactNode;
}) {
  await assertGuidedJourneyAccess(requirement);
  return <>{children}</>;
}
