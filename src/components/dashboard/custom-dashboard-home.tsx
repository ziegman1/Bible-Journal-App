import type { ReactNode } from "react";
import { Fragment } from "react";
import { getIdentityStreakStats } from "@/app/actions/identity-streaks";
import { ChatDashboardPracticeCard } from "@/components/dashboard/chat-dashboard-practice-card";
import { CommunityNodeCard } from "@/components/dashboard/community-node-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStreakTile } from "@/components/dashboard/dashboard-streak-tile";
import { FormationMomentumCard } from "@/components/dashboard/formation-momentum-card";
import { IdentityProfileHeader } from "@/components/dashboard/identity-profile-header";
import { IdentityQuickActionsRow } from "@/components/dashboard/identity-quick-actions-row";
import { JourneyNodeCard } from "@/components/dashboard/journey-node-card";
import { PrayDashboardPracticeCard } from "@/components/dashboard/pray-dashboard-practice-card";
import { ScriptureMemoryDashboardCard } from "@/components/dashboard/scripture-memory-dashboard-card";
import { ShareDashboardPracticeCard } from "@/components/dashboard/share-dashboard-practice-card";
import { SimpleToolLinkCard } from "@/components/dashboard/simple-tool-link-card";
import { SoapsDashboardPracticeCard } from "@/components/dashboard/soaps-dashboard-practice-card";
import { ThirdsDashboardPracticeCard } from "@/components/dashboard/thirds-dashboard-practice-card";
import { STREAK_LABELS, type DashboardItemId } from "@/lib/app-experience-mode/dashboard-items";
import {
  dashboardItemHasStreakTile,
  quickActionForDashboardItem,
  streakLabelKeyForDashboardItem,
} from "@/lib/app-experience-mode/custom-dashboard-rhythm";
import { mockCommunityNodes, mockMultiplicationNodes } from "@/lib/dashboard/mock-dashboard-data";
import type { GrowthModePresentation } from "@/lib/growth-mode/types";

function statByLabel(
  label: string,
  stats: Awaited<ReturnType<typeof getIdentityStreakStats>>
): { label: string; value: string } {
  const row = stats.find((s) => s.label === label);
  return { label, value: row?.value ?? "—" };
}

const GROWTH_NODE_BY_ITEM: Record<
  "growth_transformed_person" | "growth_mawl" | "growth_pathway",
  (typeof mockMultiplicationNodes)[number] & { iconIndex: 0 | 1 | 2 }
> = {
  growth_transformed_person: { ...mockMultiplicationNodes[0], iconIndex: 0 },
  growth_mawl: { ...mockMultiplicationNodes[1], iconIndex: 1 },
  growth_pathway: { ...mockMultiplicationNodes[2], iconIndex: 2 },
};

function needsIdentityStreakFetch(itemIds: readonly DashboardItemId[]): boolean {
  return itemIds.some((id) => dashboardItemHasStreakTile(id));
}

/**
 * Custom experience: header + Me/BADWR always shown; then only selected feature bundles.
 */
export async function CustomDashboardHome({
  itemIds,
  displayName,
  soapsActionHref,
  soapsActionLabel,
  primaryChatGroupId,
  presentation,
}: {
  itemIds: readonly DashboardItemId[];
  displayName: string;
  soapsActionHref: string;
  soapsActionLabel: string;
  primaryChatGroupId: string | null;
  presentation: GrowthModePresentation;
}) {
  const identityStats = needsIdentityStreakFetch(itemIds)
    ? await getIdentityStreakStats()
    : [];

  const toolsOnly = !presentation.showPracticePaceMeters;
  const { copyTone } = presentation;

  const quickActionsOrdered = itemIds
    .map((id) => quickActionForDashboardItem(id, soapsActionHref, soapsActionLabel))
    .filter((a): a is NonNullable<typeof a> => a != null);
  const mergeQuick = quickActionsOrdered.length >= 2;

  const streakRowsOrdered = itemIds.flatMap((id) => {
    const key = streakLabelKeyForDashboardItem(id);
    if (!key) return [];
    const st = statByLabel(STREAK_LABELS[key], identityStats);
    return [{ label: st.label, value: st.value }];
  });
  const mergeStreak = streakRowsOrdered.length >= 2;

  /** Inside Me/BADWR card, directly under merged “Your rhythm” when both apply. */
  const hoistMomentumAfterMergedRhythm =
    mergeStreak && itemIds.includes("feature_discipleship_momentum");

  const identityCardExtensions =
    mergeQuick || mergeStreak || hoistMomentumAfterMergedRhythm ? (
      <>
        {mergeQuick ? (
          <IdentityQuickActionsRow embedded actions={quickActionsOrdered} />
        ) : null}
        {mergeStreak ? (
          <div className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {streakRowsOrdered.map((row) => (
              <DashboardStreakTile key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        ) : null}
        {hoistMomentumAfterMergedRhythm ? <FormationMomentumCard /> : null}
      </>
    ) : null;

  const chunks: ReactNode[] = [];

  for (let i = 0; i < itemIds.length; i++) {
    const id = itemIds[i]!;
    const key = `dash-item-${i}-${id}`;

    switch (id) {
      case "feature_soaps": {
        const st = statByLabel(STREAK_LABELS.soaps, identityStats);
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeQuick && (
              <IdentityQuickActionsRow
                actions={[{ href: soapsActionHref, label: soapsActionLabel }]}
              />
            )}
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            <SoapsDashboardPracticeCard toolsOnly={toolsOnly} copyTone={copyTone} />
          </div>
        );
        break;
      }
      case "feature_pray": {
        const st = statByLabel(STREAK_LABELS.prayer, identityStats);
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeQuick && (
              <IdentityQuickActionsRow actions={[{ href: "/app/prayer", label: "Pray" }]} />
            )}
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            <PrayDashboardPracticeCard toolsOnly={toolsOnly} copyTone={copyTone} />
          </div>
        );
        break;
      }
      case "feature_share": {
        const st = statByLabel(STREAK_LABELS.share, identityStats);
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            <ShareDashboardPracticeCard toolsOnly={toolsOnly} copyTone={copyTone} />
          </div>
        );
        break;
      }
      case "feature_scripture_memory": {
        const st = statByLabel(STREAK_LABELS.scriptureMemory, identityStats);
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeQuick && (
              <IdentityQuickActionsRow
                actions={[{ href: "/app/scripture-memory", label: "Scripture Memory" }]}
              />
            )}
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            <ScriptureMemoryDashboardCard toolsOnly={toolsOnly} copyTone={copyTone} />
          </div>
        );
        break;
      }
      case "feature_chat": {
        const st = statByLabel(STREAK_LABELS.chatWeekly, identityStats);
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            {primaryChatGroupId ? (
              <ChatDashboardPracticeCard
                groupId={primaryChatGroupId}
                toolsOnly={toolsOnly}
                copyTone={copyTone}
              />
            ) : (
              <SimpleToolLinkCard
                title="CHAT"
                description="Join or create a CHAT accountability group to see reading pace and check-ins here."
                href="/app/chat"
                ctaLabel="Open CHAT"
              />
            )}
          </div>
        );
        break;
      }
      case "feature_discipleship_momentum":
        if (hoistMomentumAfterMergedRhythm) break;
        chunks.push(
          <Fragment key={key}>
            <FormationMomentumCard />
          </Fragment>
        );
        break;
      case "feature_thirds": {
        const st = statByLabel(STREAK_LABELS.thirdsWeekly, identityStats);
        const node = mockCommunityNodes[0]!;
        chunks.push(
          <div key={key} className="space-y-3">
            {!mergeStreak && <DashboardStreakTile label={st.label} value={st.value} />}
            <ThirdsDashboardPracticeCard toolsOnly={toolsOnly} copyTone={copyTone} />
            <CommunityNodeCard
              title={node.title}
              description={node.description}
              countLabel={"countLabel" in node ? node.countLabel : undefined}
              href={node.href}
              iconIndex={0}
            />
          </div>
        );
        break;
      }
      case "feature_read":
        chunks.push(
          <Fragment key={key}>
            <SimpleToolLinkCard
              title="Read Scripture"
              description="Choose a book and chapter to read in the app."
              href="/app/read"
              ctaLabel="Open reading"
            />
          </Fragment>
        );
        break;
      case "feature_list_of_100":
        chunks.push(
          <Fragment key={key}>
            <SimpleToolLinkCard
              title="List of 100"
              description="Relational stewardship list for prayer and outreach."
              href="/app/list-of-100"
              ctaLabel="Open List of 100"
            />
          </Fragment>
        );
        break;
      case "growth_transformed_person":
      case "growth_mawl":
      case "growth_pathway": {
        const node = GROWTH_NODE_BY_ITEM[id];
        chunks.push(
          <Fragment key={key}>
            <JourneyNodeCard
              title={node.title}
              description={node.description}
              statusLabel={node.statusLabel}
              href={node.href}
              iconIndex={node.iconIndex}
            />
          </Fragment>
        );
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,42rem)] flex-col gap-4 px-4 py-6 sm:px-6">
      <DashboardHeader />
      <IdentityProfileHeader displayName={displayName}>{identityCardExtensions}</IdentityProfileHeader>
      {chunks}
    </div>
  );
}
