import { CommunityNodeCard } from "@/components/dashboard/community-node-card";
import { mockCommunityNodes } from "@/lib/dashboard/mock-dashboard-data";

export function CommunityRingSection() {
  return (
    <section aria-labelledby="dashboard-community-heading">
      <h2
        id="dashboard-community-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Community
      </h2>
      <div className="flex flex-col gap-3">
        {mockCommunityNodes.map((node, i) => (
          <CommunityNodeCard
            key={node.title}
            title={node.title}
            description={node.description}
            countLabel={"countLabel" in node ? node.countLabel : undefined}
            href={node.href}
            iconIndex={i as 0 | 1 | 2}
          />
        ))}
      </div>
    </section>
  );
}
