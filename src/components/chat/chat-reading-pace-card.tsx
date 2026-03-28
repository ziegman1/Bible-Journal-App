import { getChatReadingPaceBundle } from "@/app/actions/chat-reading-pace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatReadingPaceMeter } from "@/components/chat/chat-reading-pace-meter";
import { ChatReadingPaceSettingsForm } from "@/components/chat/chat-reading-pace-settings-form";

type Variant = "meeting" | "manage";

export async function ChatReadingPaceCard({
  groupId,
  variant,
}: {
  groupId: string;
  variant: Variant;
}) {
  const bundle = await getChatReadingPaceBundle(groupId);
  if ("error" in bundle) {
    return null;
  }

  const { settings, pace } = bundle;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif font-light">Reading pace</CardTitle>
        <CardDescription>
          Compared to your group&apos;s daily chapter goal and start date, using your SOAPS bookmark
          in the reader.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ChatReadingPaceMeter
          needleDegrees={pace.needleDegrees}
          status={pace.status}
          message={pace.message}
          expectedChapters={pace.expectedChapters}
          actualChapters={pace.actualChapters}
          daysElapsed={pace.daysElapsed}
          chaptersPerDay={settings.chapters_per_day}
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
