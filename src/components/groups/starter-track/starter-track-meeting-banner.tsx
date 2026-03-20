import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getStarterWeekConfig } from "@/lib/groups/starter-track/starter-track-v1-config";

interface StarterTrackMeetingBannerProps {
  groupId: string;
  starterTrackWeek: number;
}

export function StarterTrackMeetingBanner({
  groupId,
  starterTrackWeek,
}: StarterTrackMeetingBannerProps) {
  const cfg = getStarterWeekConfig(starterTrackWeek);
  if (!cfg) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/25 px-4 py-3 mb-6">
      <div className="flex items-start gap-3">
        <BookOpen className="size-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">
            Starter Track — Week {starterTrackWeek}: {cfg.shortLabel}
          </p>
          <p className="text-stone-700 dark:text-stone-300">
            Follow the usual Look Back / Look Up / Look Forward flow. For this
            week’s practice and reminders, open the week guide.
          </p>
          <Link
            href={`/app/groups/${groupId}/starter-track/week/${starterTrackWeek}`}
            className="inline-block text-amber-800 dark:text-amber-200 font-medium underline underline-offset-2"
          >
            Open week {starterTrackWeek} guide
          </Link>
        </div>
      </div>
    </div>
  );
}
