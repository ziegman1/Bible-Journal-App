import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function FormationMomentumInspectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertGuidedJourneyNotBlockedPath("/app/formation-momentum-inspect");
  return <>{children}</>;
}
