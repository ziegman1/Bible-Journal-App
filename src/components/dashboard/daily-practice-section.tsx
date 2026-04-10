import { ChatDashboardPracticeCard } from "@/components/dashboard/chat-dashboard-practice-card";
import { PrayDashboardPracticeCard } from "@/components/dashboard/pray-dashboard-practice-card";
import { ShareDashboardPracticeCard } from "@/components/dashboard/share-dashboard-practice-card";
import { SoapsDashboardPracticeCard } from "@/components/dashboard/soaps-dashboard-practice-card";
import { ScriptureMemoryDashboardCard } from "@/components/dashboard/scripture-memory-dashboard-card";
import { PracticeNodeCard } from "@/components/dashboard/practice-node-card";
import { mockPracticeNodes } from "@/lib/dashboard/mock-dashboard-data";
import type { GrowthModePresentation } from "@/lib/growth-mode/types";

export async function DailyPracticeSection({
  primaryChatGroupId = null,
  presentation,
}: {
  primaryChatGroupId?: string | null;
  presentation: GrowthModePresentation;
}) {
  const toolsOnly = !presentation.showPracticePaceMeters;
  const { copyTone } = presentation;

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
            <SoapsDashboardPracticeCard
              key="soaps-pace"
              toolsOnly={toolsOnly}
              copyTone={copyTone}
            />
          ) : node.theme === "pray" ? (
            <PrayDashboardPracticeCard key="pray-wheel" toolsOnly={toolsOnly} copyTone={copyTone} />
          ) : node.theme === "share" ? (
            <ShareDashboardPracticeCard key="share-pace" toolsOnly={toolsOnly} copyTone={copyTone} />
          ) : node.theme === "memory" ? (
            <ScriptureMemoryDashboardCard key="scripture-memory" />
          ) : node.theme === "chat" && primaryChatGroupId ? (
            <ChatDashboardPracticeCard
              key="chat-pace"
              groupId={primaryChatGroupId}
              toolsOnly={toolsOnly}
              copyTone={copyTone}
            />
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
