import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudyThread } from "@/app/actions/threads";
import { getBookIdFromName } from "@/lib/scripture/books";
import { ThreadConversation } from "@/components/thread-conversation";
import { SaveThreadToJournal } from "@/components/save-thread-to-journal";
import { ThreadPageClient } from "@/components/thread-page-client";

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: PageProps) {
  const { threadId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [result, { data: profile }] = await Promise.all([
    getStudyThread(threadId),
    supabase.from("profiles").select("ai_style").eq("id", user.id).single(),
  ]);

  if (result.error || !result.thread) {
    notFound();
  }

  const { thread, messages } = result;
  const aiStyle = (profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced";
  const bookId = getBookIdFromName(thread.book) ?? thread.book.toLowerCase().replace(/\s+/g, "");
  const firstUserMessage = (messages ?? []).find((m) => m.role === "user");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <Link
        href="/app/read"
        className="text-sm text-stone-600 dark:text-stone-400 hover:underline inline-block"
      >
        ← Back to Read
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
            Study thread
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {thread.reference}
            {thread.title && ` — ${thread.title}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SaveThreadToJournal
            threadId={threadId}
            reference={thread.reference}
            bookName={thread.book}
            chapter={thread.chapter}
            verseStart={thread.verse_start}
            verseEnd={thread.verse_end}
            firstQuestion={firstUserMessage?.content}
          />
          <ThreadPageClient threadId={threadId} />
        </div>
      </div>

      <section>
        <ThreadConversation
        threadId={threadId}
        threadReference={thread.reference}
        bookId={bookId}
        bookName={thread.book}
        chapter={thread.chapter}
        verseStart={thread.verse_start ?? undefined}
        verseEnd={thread.verse_end ?? undefined}
        initialMessages={messages ?? []}
        aiStyle={aiStyle}
      />
      </section>
    </div>
  );
}
