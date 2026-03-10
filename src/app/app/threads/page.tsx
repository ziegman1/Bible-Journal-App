import Link from "next/link";
import { listStudyThreads } from "@/app/actions/threads";
import { ThreadCard } from "@/components/thread-card";
import { MessageSquare } from "lucide-react";

export default async function ThreadsPage() {
  const { threads } = await listStudyThreads(30);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-2">
        Study threads
      </h1>
      <p className="text-stone-600 dark:text-stone-400 text-sm mb-8">
        Your conversation threads from Ask AI. Start a new one by asking a question in the reader.
      </p>

      {threads.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-lg border border-dashed border-stone-200 dark:border-stone-800">
          <MessageSquare className="size-12 mx-auto text-stone-300 dark:text-stone-600 mb-4" />
          <p className="text-stone-500 dark:text-stone-400">No study threads yet.</p>
          <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
            Select a passage in the reader and ask a question to start a thread.
          </p>
          <Link
            href="/app/read"
            className="inline-block mt-6 text-sm text-stone-600 dark:text-stone-400 hover:underline"
          >
            Go to Read →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              id={thread.id}
              reference={thread.reference}
              title={thread.title}
              created_at={thread.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
