import { JourneyNodeCard } from "@/components/dashboard/journey-node-card";
import { mockJourneyNodes } from "@/lib/dashboard/mock-dashboard-data";

export function GrowthJourneySection() {
  return (
    <section aria-labelledby="dashboard-growth-heading">
      <h2
        id="dashboard-growth-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Growth journey
      </h2>
      <div className="flex flex-col gap-3">
        {mockJourneyNodes.map((node, i) => (
          <JourneyNodeCard
            key={node.title}
            title={node.title}
            description={node.description}
            statusLabel={node.statusLabel}
            progressLabel={"progressLabel" in node ? node.progressLabel : undefined}
            href={node.href}
            iconIndex={i as 0 | 1}
          />
        ))}
      </div>
    </section>
  );
}
