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
  return (
    <section aria-labelledby="dashboard-identity-heading" className="flex h-full min-h-0 flex-col gap-4">
      <h2 id="dashboard-identity-heading" className="sr-only">
        Identity and status
      </h2>
      <IdentityCoreCard
        displayName={displayName}
        phaseLabel={mockIdentityCore.phaseLabel}
        nextActionLabel={nextActionLabel}
        nextActionHref={nextActionHref}
        stats={mockIdentityCore.stats}
      />
      <BadwrReproductionCard />
    </section>
  );
}
