import { JourneyNodeCard } from "@/components/dashboard/journey-node-card";
import { mockMultiplicationNodes } from "@/lib/dashboard/mock-dashboard-data";

export function MultiplicationSection() {
  return (
    <section aria-labelledby="dashboard-multiplication-heading">
      <h2
        id="dashboard-multiplication-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Multiplication
      </h2>
      <div className="flex flex-col gap-3">
        {mockMultiplicationNodes.map((node, i) => (
          <JourneyNodeCard
            key={node.title}
            title={node.title}
            description={node.description}
            statusLabel={node.statusLabel}
            href={node.href}
            iconIndex={i as 0 | 1 | 2}
          />
        ))}
      </div>
    </section>
  );
}
