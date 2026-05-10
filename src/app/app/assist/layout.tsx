import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function AssistLayout({ children }: { children: React.ReactNode }) {
  await assertGuidedJourneyNotBlockedPath("/app/assist");
  return <>{children}</>;
}
