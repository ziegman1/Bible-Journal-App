import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGroup } from "@/app/actions/groups";
import { createClient } from "@/lib/supabase/server";
import { ChatAccountabilityGuide } from "@/components/chat/chat-accountability-guide";
import { ChatReadingPaceCard } from "@/components/chat/chat-reading-pace-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { fetchUserGrowthPresentation } from "@/lib/growth-mode/server";
import { Settings } from "lucide-react";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

type GroupFields = {
  archived_at?: string | null;
  group_kind?: string | null;
};

export default async function ChatGroupMeetingPage({ params }: PageProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getGroup(groupId);
  if (result.error || !result.group) {
    if (result.error === "Not a member of this group") redirect("/app");
    notFound();
  }

  const { group } = result;
  const g = group as typeof group & GroupFields;
  const groupKind = g.group_kind ?? "thirds";
  if (groupKind !== "chat") {
    redirect(`/app/groups/${groupId}`);
  }

  const isArchived = g.archived_at != null && String(g.archived_at).length > 0;

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  const memberCount = count ?? 0;
  const growthPresentation = await fetchUserGrowthPresentation(supabase, user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 sm:px-6">
      <div className="mb-6">
        <Link
          href="/app/chat"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← CHAT
        </Link>
      </div>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            CHAT meeting
          </p>
          <h1 className="text-2xl font-serif font-light text-foreground">{group.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-violet-100/60 px-2 py-0.5 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
            {isArchived ? (
              <span className="text-amber-800 dark:text-amber-200">Archived</span>
            ) : null}
          </div>
        </div>
        <Link
          href={`/app/chat/groups/${groupId}/manage`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "shrink-0 text-muted-foreground hover:text-foreground"
          )}
          aria-label="Manage group"
          title="Manage group"
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <div className="space-y-8">
        <ChatReadingPaceCard
          groupId={groupId}
          variant="meeting"
          copyTone={growthPresentation.copyTone}
        />
        <ChatAccountabilityGuide variant="meeting" />
      </div>
    </div>
  );
}
