import { getChatReadingPaceBundle } from "@/app/actions/chat-reading-pace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatReadingPaceMeter } from "@/components/chat/chat-reading-pace-meter";
import { ChatReadingPaceSettingsForm } from "@/components/chat/chat-reading-pace-settings-form";
import {
  chatDailyReadingShortLineForTone,
  chatReadingPaceCardDescription,
  readingPaceMessageForTone,
} from "@/lib/growth-mode/copy";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";

type Variant = "meeting" | "manage";

export async function ChatReadingPaceCard({
  groupId,
  variant,
  copyTone = "accountability",
}: {
  groupId: string;
  variant: Variant;
  copyTone?: GrowthCopyTone;
}) {
  const bundle = await getChatReadingPaceBundle(groupId);
  if ("error" in bundle) {
    return null;
  }

  const { settings, pace, dailyShared } = bundle;
  const paceMessage = readingPaceMessageForTone(pace.message, copyTone);
  const dailyShortLine = chatDailyReadingShortLineForTone(
    dailyShared.pairMetGoalToday,
    copyTone
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif font-light">Reading pace</CardTitle>
        <CardDescription>{chatReadingPaceCardDescription(copyTone)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ChatReadingPaceMeter
          needleDegrees={pace.needleDegrees}
          status={pace.status}
          message={paceMessage}
          expectedChapters={pace.expectedChapters}
          actualChapters={pace.actualChapters}
          daysElapsed={pace.daysElapsed}
          chaptersPerDay={settings.chapters_per_day}
          copyTone={copyTone}
          dailyShortLine={dailyShortLine}
          dailyTargetSummary={dailyShared.targetSummary}
          pairMetDaily={dailyShared.pairMetGoalToday}
        />
        {variant === "manage" ? (
          <ChatReadingPaceSettingsForm groupId={groupId} initial={settings} />
        ) : (
          <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
            Anyone in the group can update the shared schedule in{" "}
            <span className="text-foreground">Manage</span> (gear icon).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
