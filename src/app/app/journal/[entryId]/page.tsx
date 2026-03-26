import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntryEditor } from "@/components/entry-editor";
import { EntryDeleteButton } from "@/components/entry-delete-button";
import { AIResponseSections } from "@/components/ai-response-sections";
import { isMissingSoapsColumnsPostgrestError } from "@/lib/journal/soaps-column-error";
import { MessageSquare } from "lucide-react";

const JOURNAL_ENTRY_SELECT_EXTENDED = `
      id,
      entry_date,
      year,
      reference,
      book,
      chapter,
      verse_start,
      verse_end,
      user_question,
      scripture_text,
      user_reflection,
      prayer,
      application,
      soaps_share,
      title,
      ai_response_id,
      study_thread_id,
      created_at,
      updated_at
    `;

const JOURNAL_ENTRY_SELECT_BASE = `
      id,
      entry_date,
      year,
      reference,
      book,
      chapter,
      verse_start,
      verse_end,
      user_question,
      user_reflection,
      prayer,
      application,
      title,
      ai_response_id,
      study_thread_id,
      created_at,
      updated_at
    `;

type JournalEntryPageRow = {
  id: string;
  entry_date: string;
  year: number;
  reference: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  user_question: string | null;
  user_reflection: string | null;
  prayer: string | null;
  application: string | null;
  title: string | null;
  ai_response_id: string | null;
  study_thread_id: string | null;
  created_at: string;
  updated_at: string;
  scripture_text?: string | null;
  soaps_share?: string | null;
};

interface PageProps {
  params: Promise<{ entryId: string }>;
}

export default async function JournalEntryPage({ params }: PageProps) {
  const { entryId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: entryRaw, error: entryError } = await supabase
    .from("journal_entries")
    .select(JOURNAL_ENTRY_SELECT_EXTENDED)
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  let entry: JournalEntryPageRow | null = entryRaw as JournalEntryPageRow | null;

  if (entryError && isMissingSoapsColumnsPostgrestError(entryError.message)) {
    const { data: legacy } = await supabase
      .from("journal_entries")
      .select(JOURNAL_ENTRY_SELECT_BASE)
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();
    entry = legacy as JournalEntryPageRow | null;
  } else if (entryError || !entryRaw) {
    entry = null;
  }

  if (!entry) notFound();

  let aiResponse = null;
  if (entry.ai_response_id) {
    const { data } = await supabase
      .from("ai_responses")
      .select("response_json")
      .eq("id", entry.ai_response_id)
      .single();
    aiResponse = data?.response_json;
  }

  const { data: entryTags } = await supabase
    .from("journal_entry_tags")
    .select("tag_id, tags(name)")
    .eq("entry_id", entryId);
  const tags: string[] = [];
  (entryTags ?? []).forEach((et) => {
    const tagsData = et.tags as { name: string } | { name: string }[] | null;
    const name = Array.isArray(tagsData) ? tagsData[0]?.name : tagsData?.name;
    if (name) tags.push(name);
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/app/journal"
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← Back to SOAPS
        </Link>
        <EntryDeleteButton entryId={entry.id} />
      </div>

      <article className="space-y-8">
        <header>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {entry.entry_date}
          </p>
          <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
            {entry.title || entry.reference}
          </h1>
          {entry.title && (
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              {entry.reference}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                {t}
              </span>
            ))}
            {entry.study_thread_id && (
              <Link
                href={`/app/thread/${entry.study_thread_id}`}
                className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-1"
              >
                <MessageSquare className="size-3" />
                View thread
              </Link>
            )}
          </div>
        </header>

        {entry.user_question && (
          <section className="rounded-lg border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-900/30">
            <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
              Your question
            </h2>
            <p className="text-stone-700 dark:text-stone-300 font-serif">
              {entry.user_question}
            </p>
          </section>
        )}

        {aiResponse && (
          <section className="rounded-lg border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-900/30">
            <h2 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
              AI Insight
            </h2>
            <AIResponseSections data={aiResponse} />
          </section>
        )}

        <EntryEditor
          entryId={entry.id}
          reference={entry.reference}
          entryDate={entry.entry_date}
          initialTitle={entry.title}
          initialScripture={entry.scripture_text ?? null}
          initialReflection={entry.user_reflection}
          initialPrayer={entry.prayer}
          initialApplication={entry.application}
          initialSoapsShare={entry.soaps_share ?? null}
          initialTags={tags}
          userQuestion={entry.user_question}
        />
      </article>
    </div>
  );
}
