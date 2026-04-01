import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InsightsDateBounds,
  InsightsDateRange,
  InsightsSummary,
  TagCount,
  BookCount,
  PassageRevisit,
  FrequencyBucket,
  KeywordCount,
} from "./types";

/** Parse date range preset into start/end bounds */
export function getDateBounds(
  range: InsightsDateRange,
  customStart?: string,
  customEnd?: string
): InsightsDateBounds {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (range === "custom" && customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
    };
  }

  let start: Date;
  if (range === "lastWeek") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (range === "last30") {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  } else if (range === "last90") {
    start = new Date(now);
    start.setDate(start.getDate() - 90);
  } else if (range === "thisYear") {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (range === "allTime") {
    return {
      start: "1970-01-01",
      end: today,
    };
  } else {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: today,
  };
}

/** Journal row shape for insights (SOAPS columns optional when DB migration not applied) */
type JournalEntryInsightRow = {
  id: string;
  entry_date: string;
  reference: string;
  book: string;
  chapter: number;
  user_reflection: string | null;
  prayer: string | null;
  application: string | null;
  scripture_text?: string | null;
  soaps_share?: string | null;
};

/** Common English stop words for keyword extraction */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were", "will",
  "with", "i", "me", "my", "myself", "we", "our", "ours", "you", "your", "yours",
  "this", "these", "those", "am", "been", "being", "have", "had", "do", "does",
  "did", "would", "could", "should", "can", "may", "might", "must", "shall",
  "what", "which", "who", "when", "where", "why", "how", "all", "each", "every",
  "both", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
  "only", "own", "same", "so", "than", "too", "very", "just", "but", "if", "or",
  "because", "until", "while", "about", "into", "through", "during", "before",
  "after", "above", "below", "between", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each", "every",
  "god", "lord", "jesus", "christ", "father", "son", "spirit", "holy", "amen",
]);

/** Extract and count top keywords from text (simple tokenization) */
function extractKeywords(texts: (string | null)[], limit = 20): KeywordCount[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    if (!text || typeof text !== "string") continue;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    for (const w of words) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/** Aggregate insights data for a user over a date range */
export async function aggregateInsights(
  supabase: SupabaseClient,
  userId: string,
  bounds: InsightsDateBounds
): Promise<InsightsSummary> {
  const startTs = `${bounds.start}T00:00:00`;
  const endTs = `${bounds.end}T23:59:59`;

  const JOURNAL_INSIGHTS_BASE =
    "id, entry_date, reference, book, chapter, user_reflection, prayer, application";
  const JOURNAL_INSIGHTS_EXTENDED = `${JOURNAL_INSIGHTS_BASE}, scripture_text, soaps_share`;

  const [
    { count: journalCount },
    { count: threadsCount },
    { count: aiCount },
    journalRowsResult,
    { data: threads },
    { data: sessions },
    { data: aiResponses },
  ] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("entry_date", bounds.start)
      .lte("entry_date", bounds.end),
    supabase
      .from("study_threads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs),
    supabase
      .from("ai_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs),
    supabase
      .from("journal_entries")
      .select(JOURNAL_INSIGHTS_EXTENDED)
      .eq("user_id", userId)
      .gte("entry_date", bounds.start)
      .lte("entry_date", bounds.end)
      .order("entry_date", { ascending: true }),
    supabase
      .from("study_threads")
      .select("id, reference, book, chapter")
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs),
    supabase
      .from("reading_sessions")
      .select("book, chapter, reference")
      .eq("user_id", userId)
      .gte("read_at", startTs)
      .lte("read_at", endTs),
    supabase
      .from("ai_responses")
      .select("reference, book, chapter")
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs),
  ]);

  let entries: JournalEntryInsightRow[] | null = journalRowsResult.data as
    | JournalEntryInsightRow[]
    | null;
  if (journalRowsResult.error) {
    const { data: fallback } = await supabase
      .from("journal_entries")
      .select(JOURNAL_INSIGHTS_BASE)
      .eq("user_id", userId)
      .gte("entry_date", bounds.start)
      .lte("entry_date", bounds.end)
      .order("entry_date", { ascending: true });
    entries = fallback as JournalEntryInsightRow[] | null;
  }

  const entryIds = (entries ?? []).map((e) => e.id);
  let tagRows: { entry_id: string; tags: unknown }[] = [];
  if (entryIds.length > 0) {
    const { data: jet } = await supabase
      .from("journal_entry_tags")
      .select("entry_id, tags(name, slug)")
      .in("entry_id", entryIds);
    tagRows = jet ?? [];
  }

  const tagCounts = new Map<string, { slug: string; count: number }>();
  for (const row of tagRows) {
    const raw = row.tags;
    const t = Array.isArray(raw) ? raw[0] : raw;
    const tag = t as { name?: string; slug?: string } | null;
    if (tag?.name) {
      const cur = tagCounts.get(tag.name) ?? { slug: tag.slug ?? "", count: 0 };
      cur.count++;
      tagCounts.set(tag.name, cur);
    }
  }
  const topTags: TagCount[] = [...tagCounts.entries()]
    .map(([name, { slug, count }]) => ({ name, slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const booksFromEntries = new Map<string, number>();
  const booksFromSessions = new Map<string, number>();
  const booksFromThreads = new Map<string, number>();
  const booksFromAI = new Map<string, number>();
  const passageCounts = new Map<string, { book: string; chapter: number; count: number }>();
  const chapterCounts = new Map<string, number>();

  for (const e of entries ?? []) {
    booksFromEntries.set(e.book, (booksFromEntries.get(e.book) ?? 0) + 1);
    const key = `${e.reference}`;
    const cur = passageCounts.get(key) ?? { book: e.book, chapter: e.chapter, count: 0 };
    cur.count++;
    passageCounts.set(key, cur);
    const chKey = `${e.book}:${e.chapter}`;
    chapterCounts.set(chKey, (chapterCounts.get(chKey) ?? 0) + 1);
  }
  for (const s of sessions ?? []) {
    booksFromSessions.set(s.book, (booksFromSessions.get(s.book) ?? 0) + 1);
  }
  for (const t of threads ?? []) {
    booksFromThreads.set(t.book, (booksFromThreads.get(t.book) ?? 0) + 1);
  }
  for (const a of aiResponses ?? []) {
    booksFromAI.set(a.book, (booksFromAI.get(a.book) ?? 0) + 1);
  }

  const allBooks = new Set([
    ...booksFromEntries.keys(),
    ...booksFromSessions.keys(),
    ...booksFromThreads.keys(),
    ...booksFromAI.keys(),
  ]);

  const topBooks: BookCount[] = [...allBooks]
    .map((book) => ({
      book,
      count:
        (booksFromEntries.get(book) ?? 0) +
        (booksFromSessions.get(book) ?? 0) +
        (booksFromThreads.get(book) ?? 0) +
        (booksFromAI.get(book) ?? 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const passagesMostRevisited: PassageRevisit[] = [...passageCounts.entries()]
    .filter(([, v]) => v.count > 1)
    .map(([ref, { book, chapter, count }]) => ({ reference: ref, book, chapter, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topChaptersReferenced = [...chapterCounts.entries()]
    .map(([key, count]) => {
      const [book, ch] = key.split(":");
      return { book, chapter: parseInt(ch, 10), count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const byMonth = new Map<string, number>();
  const byWeek = new Map<string, number>();
  for (const e of entries ?? []) {
    const month = e.entry_date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    const d = new Date(e.entry_date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekLabel = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    byWeek.set(weekLabel, (byWeek.get(weekLabel) ?? 0) + 1);
  }
  const frequencyByMonth: FrequencyBucket[] = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
  const frequencyByWeek: FrequencyBucket[] = [...byWeek.entries()]
    .sort((a, b) => {
      const aDate = a[0].replace("Week of ", "");
      const bDate = b[0].replace("Week of ", "");
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    })
    .map(([label, count]) => ({ label, count }))
    .slice(-12);

  const scriptureTexts = (entries ?? []).map((e) => e.scripture_text ?? null);
  const reflectionTexts = (entries ?? []).map((e) => e.user_reflection);
  const prayerTexts = (entries ?? []).map((e) => e.prayer);
  const applicationTexts = (entries ?? []).map((e) => e.application);
  const shareTexts = (entries ?? []).map((e) => e.soaps_share ?? null);
  const allTexts = [
    ...scriptureTexts,
    ...reflectionTexts,
    ...prayerTexts,
    ...applicationTexts,
    ...shareTexts,
  ];
  const topKeywords = extractKeywords(allTexts, 25);

  const threadIds = (threads ?? []).map((t) => t.id);
  let threadInsights: string[] = [];
  if (threadIds.length > 0) {
    const { data: messages } = await supabase
      .from("thread_messages")
      .select("structured_ai_response, content")
      .in("thread_id", threadIds)
      .eq("role", "assistant")
      .order("created_at", { ascending: false });
    for (const m of messages ?? []) {
      const s = m.structured_ai_response as { summary?: string; meaning?: string } | null;
      if (s?.summary) threadInsights.push(s.summary);
      else if (s?.meaning) threadInsights.push(s.meaning);
      else if (m.content && typeof m.content === "string" && m.content.length < 500) {
        threadInsights.push(m.content);
      }
    }
    threadInsights = threadInsights.slice(0, 15);
  }

  const trimSample = (s: string, max = 200) =>
    s.trim().slice(0, max) + (s.length > max ? "…" : "");
  const samplesForAI = {
    reflections: (entries ?? [])
      .map((e) => e.user_reflection)
      .filter((s): s is string => !!s?.trim())
      .slice(0, 10)
      .map((s) => trimSample(s)),
    prayers: (entries ?? [])
      .map((e) => e.prayer)
      .filter((s): s is string => !!s?.trim())
      .slice(0, 10)
      .map((s) => trimSample(s)),
    applications: (entries ?? [])
      .map((e) => e.application)
      .filter((s): s is string => !!s?.trim())
      .slice(0, 10)
      .map((s) => trimSample(s)),
    threadInsights,
  };

  return {
    dateRange: bounds,
    overview: {
      totalJournalEntries: journalCount ?? 0,
      totalStudyThreads: threadsCount ?? 0,
      totalAIQuestions: aiCount ?? 0,
      booksStudied: [...allBooks].sort(),
      booksStudiedCount: allBooks.size,
    },
    themesAndTags: { topTags },
    booksAndPassages: {
      topBooks,
      passagesMostRevisited,
      topBooksReferenced: [...booksFromEntries.entries()]
        .map(([book, count]) => ({ book, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topChaptersReferenced,
    },
    journalingActivity: {
      frequencyByMonth,
      frequencyByWeek,
    },
    repeatedWords: { topKeywords },
    samplesForAI,
  };
}
