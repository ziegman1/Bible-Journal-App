import Link from "next/link";
import type { ListedGroup } from "@/app/actions/groups";
import { ShareChatGroupSheet } from "@/components/groups/share-chat-group-sheet";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type Props = {
  listError?: string;
  /** First CHAT group only (product expects one per user). */
  primaryChat: ListedGroup | null;
  /** Additional CHAT groups beyond the first (edge case). */
  extraChatCount: number;
  /** User’s 3/3rds workspaces (separate from CHAT). */
  thirdsGroupCount: number;
  senderDisplayName: string;
};

/** Top of /app/chat — singular “Your CHAT Group” + primary button to open workspace. */
export function ChatGroupsHubList({
  listError,
  primaryChat,
  extraChatCount,
  thirdsGroupCount,
  senderDisplayName,
}: Props) {
  if (listError) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300">
        Could not load groups: {listError}
      </div>
    );
  }

  const totalListed = (primaryChat ? 1 : 0) + extraChatCount + thirdsGroupCount;

  if (!primaryChat && totalListed === 0) {
    return (
      <section className="rounded-lg border border-stone-200 bg-stone-50/60 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/30">
        <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">
          Your CHAT group
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          You don&apos;t have a CHAT group yet. When you&apos;re ready, use{" "}
          <strong className="font-medium text-stone-800 dark:text-stone-200">
            Start a CHAT group
          </strong>{" "}
          at the bottom of this page, or create a 3/3rds group from{" "}
          <Link href="/app/groups" className="font-medium underline underline-offset-2">
            3/3rds Groups
          </Link>
          .
        </p>
      </section>
    );
  }

  if (!primaryChat) {
    return (
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Your CHAT group
        </h2>
        <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
          No CHAT group is listed yet. If you created one, it may not be recognized until
          Supabase migration{" "}
          <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">
            035_chat_groups
          </code>{" "}
          is applied. Check{" "}
          <Link href="/app/groups" className="font-medium underline underline-offset-2">
            3/3rds Groups
          </Link>{" "}
          — you may have{" "}
          {thirdsGroupCount > 0 ? (
            <>
              {thirdsGroupCount} 3/3rds group{thirdsGroupCount !== 1 ? "s" : ""} under{" "}
              <Link href="/app/groups" className="font-medium underline underline-offset-2">
                3/3rds Groups
              </Link>
            </>
          ) : (
            "other workspaces there"
          )}
          .
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-white/80 dark:border-stone-700 dark:bg-stone-900/40">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">
            Your CHAT group
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            One small group is enough — open it to set the weekly time, reading plan, and
            agreement.
          </p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {primaryChat.name}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/chat/groups/${primaryChat.id}`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
            >
              Open your CHAT group
            </Link>
            <ShareChatGroupSheet senderDisplayName={senderDisplayName} />
          </div>
          {extraChatCount > 0 && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              You have {extraChatCount} more CHAT group{extraChatCount !== 1 ? "s" : ""}. Open
              each from its invite link or saved workspace URL (
              <code className="text-[11px]">/app/chat/groups/&lt;id&gt;</code>
              ).
            </p>
          )}
        </div>
      </div>

      {(thirdsGroupCount > 0 || extraChatCount > 0) && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/app/groups"
            className={cn(buttonVariants({ variant: "link", size: "sm", className: "h-auto p-0" }))}
          >
            3/3rds Groups
          </Link>
          {thirdsGroupCount > 0 ? ` (${thirdsGroupCount})` : ""}
          {" · "}
          separate from CHAT accountability groups
        </p>
      )}
    </section>
  );
}
