import { getIdentityStreakStats } from "@/app/actions/identity-streaks";
import { BadwrReproductionCard } from "@/components/dashboard/badwr-reproduction-card";
import { IdentityCoreCard } from "@/components/dashboard/identity-core-card";
import { mockIdentityCore } from "@/lib/dashboard/mock-dashboard-data";
import type { GrowthModePresentation } from "@/lib/growth-mode/types";

const GUIDED_IDENTITY_SUBTITLE =
  "SOAPS, prayer, share, and groups are here when you want them—no scorekeeping on this home view.";

export async function IdentityCoreSection({
  displayName,
  nextActionLabel = "Start today's SOAPS",
  nextActionHref = "/app/read/matthew/1",
  presentation,
}: {
  displayName: string;
  nextActionLabel?: string;
  nextActionHref?: string;
  presentation: GrowthModePresentation;
}) {
  let stats: { label: string; value: string }[] = [...mockIdentityCore.stats];
  if (presentation.showStreakStats) {
    try {
      stats = await getIdentityStreakStats();
    } catch {
      /* keep mock on failure */
    }
  } else {
    stats = [];
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
        invitationalSubtitle={presentation.showStreakStats ? null : GUIDED_IDENTITY_SUBTITLE}
      />
      {presentation.showBadwrReproductionCard ? (
        <BadwrReproductionCard copyTone={presentation.copyTone} />
      ) : null}
    </section>
  );
}
