import { InsightTile } from "@/components/dashboard/insight-tile";
import { QuickActionBar } from "@/components/dashboard/quick-action-bar";
import { mockInsightTiles, mockQuickActions } from "@/lib/dashboard/mock-dashboard-data";

export function ContextInsightSection() {
  return (
    <section
      aria-labelledby="dashboard-context-heading"
      className="flex h-full min-h-0 flex-col gap-4"
    >
      <h2
        id="dashboard-context-heading"
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Context & insights
      </h2>
      <QuickActionBar actions={mockQuickActions} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {mockInsightTiles.map((tile) => (
          <InsightTile
            key={tile.title}
            title={tile.title}
            value={tile.value}
            supportingText={tile.supportingText}
            href={tile.href}
            variant={tile.variant}
          />
        ))}
      </div>
    </section>
  );
}
