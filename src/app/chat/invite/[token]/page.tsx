import Link from "next/link";
import { ChatInformationalSections } from "@/components/chat/chat-informational-sections";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { CHAT_CONTENT } from "@/content/chatContent";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type RpcPayload = {
  ok?: boolean;
  senderName?: string;
  personalNote?: string | null;
};

export default async function ChatInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-stone-600 dark:text-stone-400">
          This page is temporarily unavailable.
        </p>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("mark_chat_growth_invite_opened", {
    p_token: token,
  });

  const payload = data as RpcPayload | null;
  const ok = !error && payload?.ok === true;
  const senderName =
    typeof payload?.senderName === "string" && payload.senderName.trim()
      ? payload.senderName.trim()
      : "Someone";
  const personalNote =
    typeof payload?.personalNote === "string" && payload.personalNote.trim()
      ? payload.personalNote.trim()
      : null;

  const redirectToMain = encodeURIComponent(CHAT_CONTENT.publicInvite.ctaAfterLoginPath);
  const signupHref = `/signup?redirectTo=${redirectToMain}`;
  const loginHref = `/login?redirectTo=${redirectToMain}`;

  if (!ok) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-xl font-serif text-stone-900 dark:text-stone-100">
          {CHAT_CONTENT.publicInvite.invalidTokenTitle}
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          {CHAT_CONTENT.publicInvite.invalidTokenBody}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={signupHref} className={cn(buttonVariants())}>
            Create Free Account
          </Link>
          <Link href={loginHref} className={cn(buttonVariants({ variant: "outline" }))}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-20">
      <header className="mb-8 space-y-3">
        <p className="text-lg text-stone-800 dark:text-stone-200">
          <strong className="font-medium">{senderName}</strong> invited you to explore CHAT
        </p>
        {personalNote ? (
          <blockquote className="rounded-lg border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300">
            <span className="block whitespace-pre-wrap">{personalNote}</span>
          </blockquote>
        ) : null}
        <nav aria-label="On this page" className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {CHAT_CONTENT.publicInvite.sectionNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-stone-700 underline underline-offset-2 dark:text-stone-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <ChatInformationalSections
        variant="public"
        className="[&_section:first-child>h2]:mt-4"
      />

      <Card className="mt-10 border-stone-200 bg-white/80 dark:border-stone-700 dark:bg-stone-900/40">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {CHAT_CONTENT.accountabilityGuideCard.title}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {CHAT_CONTENT.accountabilityGuideCard.description}
          </p>
          <Link
            href={signupHref}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
          >
            {CHAT_CONTENT.accountabilityGuideCard.buttonLabel}
          </Link>
        </CardContent>
      </Card>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={signupHref}
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto justify-center")}
        >
          Create Free Account
        </Link>
        <Link
          href={loginHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto justify-center"
          )}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
