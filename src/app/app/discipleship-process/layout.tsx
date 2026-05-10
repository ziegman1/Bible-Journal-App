import { assertGuidedJourneyNotBlockedPath } from "@/lib/app-experience-mode/journey-access.server";

export default async function DiscipleshipProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertGuidedJourneyNotBlockedPath("/app/discipleship-process");
  return <>{children}</>;
}
