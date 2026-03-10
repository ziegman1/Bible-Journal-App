import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sanitizeSearchQuery } from "@/lib/search";
import { JournalFilterProvider } from "@/components/journal-filter-context";
import { JournalTimeline } from "@/components/journal-timeline";
import { JournalFilters } from "@/components/journal-filters";

interface PageProps {
  searchParams: Promise<{ book?: string; tag?: string; month?: string; q?: string }>;
}

export default async function JournalPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const bookFilter = params.book;
  const tagFilter = params.tag;
  const monthFilter = params.month;
  const searchQuery = sanitizeSearchQuery(params.q);

  let query = supabase
    .from("journal_entries")
    .select(
      `
      id,
      entry_date,
      year,
      reference,
      title,
      user_question,
      user_reflection,
      prayer,
      application,
      created_at,
      ai_response_id,
      study_thread_id
    `
    )
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  if (bookFilter) {
    query = query.eq("book", bookFilter);
  }
  if (monthFilter) {
    const [y, m] = monthFilter.split("-");
    query = query
      .eq("year", parseInt(y, 10))
      .gte("entry_date", `${y}-${m}-01`)
      .lte("entry_date", `${y}-${m}-31`);
  }
  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,user_question.ilike.%${searchQuery}%,user_reflection.ilike.%${searchQuery}%,prayer.ilike.%${searchQuery}%,application.ilike.%${searchQuery}%`
    );
  }

  const { data: entries } = await query;

  let filteredEntries = entries ?? [];

  if (tagFilter) {
    const { data: tagRow } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", tagFilter)
      .single();
    if (tagRow) {
      const { data: tagged } = await supabase
        .from("journal_entry_tags")
        .select("entry_id")
        .eq("tag_id", tagRow.id);
      const entryIds = new Set(tagged?.map((t) => t.entry_id) ?? []);
      filteredEntries = filteredEntries.filter((e) => entryIds.has(e.id));
    }
  }

  const aiResponseIds = filteredEntries
    .map((e) => e.ai_response_id)
    .filter(Boolean) as string[];
  const { data: aiResponses } =
    aiResponseIds.length > 0
      ? await supabase
          .from("ai_responses")
          .select("id, response_json")
          .in("id", aiResponseIds)
      : { data: [] };
  const aiMap = new Map(
    (aiResponses ?? []).map((a) => [a.id, a.response_json])
  );
  const entriesWithAI = filteredEntries.map((e) => ({
    ...e,
    ai_response: e.ai_response_id ? aiMap.get(e.ai_response_id) : null,
  }));

  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .order("name");

  const { data: books } = await supabase
    .from("journal_entries")
    .select("book")
    .eq("user_id", user.id);

  const uniqueBooks = [...new Set(books?.map((b) => b.book) ?? [])].sort();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Journal
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
          Your spiritual diary — reflections, prayers, and insights from Scripture
        </p>
      </header>
      <JournalFilterProvider>
        <JournalFilters
          books={uniqueBooks}
          tags={tags ?? []}
          currentBook={bookFilter}
          currentTag={tagFilter}
          currentMonth={monthFilter}
          currentSearch={searchQuery ?? undefined}
        />
        <JournalTimeline
          entries={entriesWithAI}
          hasFilters={!!(bookFilter || tagFilter || monthFilter || searchQuery)}
        />
      </JournalFilterProvider>
    </div>
  );
}
