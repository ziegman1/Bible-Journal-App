import { getIdentityStreakStats } from "@/app/actions/identity-streaks";
import { BadwrReproductionCard } from "@/components/dashboard/badwr-reproduction-card";
import { IdentityCoreCard } from "@/components/dashboard/identity-core-card";
import { mockIdentityCore } from "@/lib/dashboard/mock-dashboard-data";

export async function IdentityCoreSection({
  displayName,
  nextActionLabel = "Start today's SOAPS",
  nextActionHref = "/app/read/matthew/1",
}: {
  displayName: string;
  nextActionLabel?: string;
  nextActionHref?: string;
}) {
  let stats: { label: string; value: string }[] = [...mockIdentityCore.stats];
  try {
    stats = await getIdentityStreakStats();
  } catch {
    /* keep mock on failure */
  }

  return (
    <section aria-labelledby="dashboard-identity-heading" className="flex h-full min-h-0 flex-col gap-4">
      <h2 id="dashboard-identity-heading" className="sr-only">
        Identity and status
      </h2>
      <IdentityCoreCard
        displayName={displayName}
        nextActionLabel={nextActionLabel}
        nextActionHref={nextActionHref}
        stats={stats}
      />
      <BadwrReproductionCard />
    </section>
  );
}
