import { IdentityCoreCard } from "@/components/dashboard/identity-core-card";
import {
  mockIdentityCore,
} from "@/lib/dashboard/mock-dashboard-data";

export function IdentityCoreSection({ displayName }: { displayName: string }) {
  return (
    <section aria-labelledby="dashboard-identity-heading" className="h-full">
      <h2 id="dashboard-identity-heading" className="sr-only">
        Identity and status
      </h2>
      <IdentityCoreCard
        displayName={displayName}
        phaseLabel={mockIdentityCore.phaseLabel}
        nextActionLabel={mockIdentityCore.nextActionLabel}
        nextActionHref={mockIdentityCore.nextActionHref}
        stats={mockIdentityCore.stats}
      />
    </section>
  );
}
