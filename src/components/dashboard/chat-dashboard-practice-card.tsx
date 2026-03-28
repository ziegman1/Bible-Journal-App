import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getChatReadingPaceBundle } from "@/app/actions/chat-reading-pace";
import { ChatReadingPaceMeter } from "@/components/chat/chat-reading-pace-meter";
import { cn } from "@/lib/utils";

const chatCard =
  "border-indigo-200/50 bg-gradient-to-br from-white via-indigo-50/35 to-slate-50/30 dark:border-indigo-500/15 dark:from-card dark:via-indigo-950/15 dark:to-slate-950/10";
const chatHover =
  "hover:border-indigo-300/70 hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.15)] dark:hover:border-indigo-500/30 dark:hover:shadow-[0_4px_20px_-4px_rgba(129,140,248,0.08)]";
const chatLabel = "text-indigo-700/70 dark:text-indigo-400/60";
const chatIconBg =
  "bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";

export async function ChatDashboardPracticeCard({ groupId }: { groupId: string }) {
  const bundle = await getChatReadingPaceBundle(groupId);
  const hasPace = !("error" in bundle);

  return (
    <Link
      href={`/app/chat/groups/${groupId}`}
      className={cn(
        "group flex min-h-[140px] flex-col rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
        chatCard,
        chatHover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.12em]",
            chatLabel
          )}
        >
          CHAT
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            chatIconBg
          )}
        >
          <MessageCircle className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Accountability group meeting hub and reading pace.
      </p>

      {hasPace ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <ChatReadingPaceMeter
            variant="compact"
            needleDegrees={bundle.pace.needleDegrees}
            status={bundle.pace.status}
            message={bundle.pace.message}
            expectedChapters={bundle.pace.expectedChapters}
            actualChapters={bundle.pace.actualChapters}
            daysElapsed={bundle.pace.daysElapsed}
            chaptersPerDay={bundle.settings.chapters_per_day}
          />
        </div>
      ) : (
        <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p>Reading pace will show here once your group schedule is available.</p>
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground/80">Open meeting · adjust pace in Manage</p>
    </Link>
  );
}
