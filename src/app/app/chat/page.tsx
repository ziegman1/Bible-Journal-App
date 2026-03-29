import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listGroupsForUser } from "@/app/actions/groups";
import { ChatGroupsHubList } from "@/components/groups/chat-groups-hub-list";
import { StartChatGroupPanel } from "@/components/groups/start-chat-group-panel";
import { ChatInformationalSections } from "@/components/chat/chat-informational-sections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { CHAT_CONTENT } from "@/content/chatContent";
import { cn } from "@/lib/utils";

export default async function ChatPage() {
  const supabase = await createClient();
  let senderDisplayName = "A friend";
  let currentUserEmail: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      currentUserEmail = user.email?.trim().toLowerCase() ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      senderDisplayName = profile?.display_name?.trim() || senderDisplayName;
    }
  }

  const listResult = await listGroupsForUser();
  const listError = "error" in listResult ? listResult.error : undefined;
  const allGroups = "groups" in listResult ? (listResult.groups ?? []) : [];
  const chatGroups = allGroups.filter((g) => g.groupKind === "chat");
  const primaryChat = chatGroups[0] ?? null;
  const extraChatCount = Math.max(0, chatGroups.length - 1);
  const thirdsGroupCount = allGroups.filter((g) => g.groupKind === "thirds").length;
  return (
    <div className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="mb-2 text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
        {CHAT_CONTENT.pageTitle}
      </h1>
      <p className="mb-8 text-stone-600 dark:text-stone-400">{CHAT_CONTENT.pageOverview}</p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Accountability groups training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Zúme Training covers why accountability matters, how small groups can meet, and
            includes video plus example question lists.
          </p>
          <a
            href="https://zume.training/accountability-groups"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2"
            )}
          >
            Open Accountability Groups on Zúme
            <ExternalLink className="size-3.5 opacity-70" aria-hidden />
          </a>
        </CardContent>
      </Card>

      <div className="mb-10">
        <ChatGroupsHubList
          listError={listError}
          primaryChat={primaryChat}
          extraChatCount={extraChatCount}
          thirdsGroupCount={thirdsGroupCount}
          senderDisplayName={senderDisplayName}
        />
      </div>

      <ChatInformationalSections variant="app" />

      <p className="mt-10 text-sm text-stone-600 dark:text-stone-400">
        <Link
          href="/app/chat/accountability-questions"
          className="font-medium text-stone-800 underline underline-offset-2 dark:text-stone-200"
        >
          {CHAT_CONTENT.accountabilityGuideCard.buttonLabel}
        </Link>
        <span className="text-stone-500 dark:text-stone-500">
          {" "}
          — same questions you&apos;ll use in your meeting; opens a print-friendly page.
        </span>
      </p>

      <StartChatGroupPanel
        inviterDisplayName={senderDisplayName}
        currentUserEmail={currentUserEmail}
        primaryChat={primaryChat}
      />
    </div>
  );
}
