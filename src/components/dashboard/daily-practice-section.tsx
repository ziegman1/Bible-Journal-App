import { ChatDashboardPracticeCard } from "@/components/dashboard/chat-dashboard-practice-card";
import { PrayDashboardPracticeCard } from "@/components/dashboard/pray-dashboard-practice-card";
import { SoapsDashboardPracticeCard } from "@/components/dashboard/soaps-dashboard-practice-card";
import { PracticeNodeCard } from "@/components/dashboard/practice-node-card";
import { mockPracticeNodes } from "@/lib/dashboard/mock-dashboard-data";

export async function DailyPracticeSection({
  primaryChatGroupId = null,
}: {
  primaryChatGroupId?: string | null;
}) {
  return (
    <section aria-labelledby="dashboard-daily-heading">
      <h2
        id="dashboard-daily-heading"
        className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Daily practice
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mockPracticeNodes.map((node) =>
          node.theme === "soap" ? (
            <SoapsDashboardPracticeCard key="soaps-pace" />
          ) : node.theme === "pray" ? (
            <PrayDashboardPracticeCard key="pray-wheel" />
          ) : node.theme === "chat" && primaryChatGroupId ? (
            <ChatDashboardPracticeCard key="chat-pace" groupId={primaryChatGroupId} />
          ) : (
            <PracticeNodeCard
              key={node.title}
              title={node.title}
              description={node.description}
              statusLabel={node.statusLabel}
              secondaryMeta={
                "secondaryMeta" in node && typeof node.secondaryMeta === "string"
                  ? node.secondaryMeta
                  : undefined
              }
              href={node.href}
              theme={node.theme}
            />
          )
        )}
      </div>
    </section>
  );
}
