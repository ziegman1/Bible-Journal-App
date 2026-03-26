import { PracticeNodeCard } from "@/components/dashboard/practice-node-card";
import { mockPracticeNodes } from "@/lib/dashboard/mock-dashboard-data";

export function DailyPracticeSection() {
  return (
    <section aria-labelledby="dashboard-daily-heading">
      <h2
        id="dashboard-daily-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Daily practice
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mockPracticeNodes.map((node) => (
          <PracticeNodeCard
            key={node.title}
            title={node.title}
            description={node.description}
            statusLabel={node.statusLabel}
            secondaryMeta={"secondaryMeta" in node ? node.secondaryMeta : undefined}
            href={node.href}
            theme={node.theme}
          />
        ))}
      </div>
    </section>
  );
}
