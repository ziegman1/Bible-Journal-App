import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnualJournalYearSelector } from "@/components/annual-journal-year-selector";

/** Annual Journey summary for embedding on the SOAPS (journal) page. */
export async function AnnualJourneySection({ year }: { year: number }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: sessions },
    { data: entries },
  ] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("book, chapter, reference, read_at")
      .eq("user_id", user.id)
      .gte("read_at", `${year}-01-01`)
      .lte("read_at", `${year}-12-31T23:59:59`)
      .order("read_at", { ascending: true }),
    supabase
      .from("journal_entries")
      .select("id, entry_date, reference, user_question, user_reflection")
      .eq("user_id", user.id)
      .eq("year", year)
      .order("entry_date", { ascending: true }),
  ]);

  const entryIds = (entries ?? []).map((e) => e.id);
  const { data: tags } =
    entryIds.length > 0
      ? await supabase
          .from("journal_entry_tags")
          .select("entry_id, tags(name)")
          .in("entry_id", entryIds)
      : { data: [] };

  const booksRead = [...new Set(sessions?.map((s) => s.book) ?? [])];
  const chaptersRead = sessions?.length ?? 0;

  const { count: questionsCount } = await supabase
    .from("ai_responses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${year}-01-01`)
    .lte("created_at", `${year}-12-31T23:59:59`);

  const reflectionsCount = entries?.length ?? 0;

  const tagCounts = new Map<string, number>();
  (tags ?? []).forEach((t) => {
    const tagsData = t.tags as { name: string } | { name: string }[] | null;
    const name = Array.isArray(tagsData) ? tagsData[0]?.name : tagsData?.name;
    if (name) {
      tagCounts.set(name, (tagCounts.get(name) ?? 0) + 1);
    }
  });
  const topThemes = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const entriesByMonth = new Map<string, typeof entries>();
  (entries ?? []).forEach((e) => {
    const month = e.entry_date.slice(0, 7);
    if (!entriesByMonth.has(month)) {
      entriesByMonth.set(month, []);
    }
    entriesByMonth.get(month)!.push(e);
  });

  const monthNames: Record<string, string> = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  return (
    <section className="space-y-6 border-b border-stone-200 pb-8 dark:border-stone-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-800 dark:text-stone-200">
            Your year in Scripture
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            A summary of your spiritual journey for the selected year
          </p>
        </div>
        <AnnualJournalYearSelector currentYear={year} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Books read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{booksRead.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Chapters read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{chaptersRead}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Questions asked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{questionsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Reflections written
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{reflectionsCount}</p>
          </CardContent>
        </Card>
      </div>

      {topThemes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topThemes.map(([name, count]) => (
                <span
                  key={name}
                  className="text-sm px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                >
                  {name} ({count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Entries by month</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesByMonth.size === 0 ? (
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              No journal entries this year.
            </p>
          ) : (
            <div className="space-y-6">
              {[...entriesByMonth.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([month, monthEntries]) => {
                  const [y, m] = month.split("-");
                  const monthLabel = `${monthNames[m] ?? m} ${y}`;
                  return (
                    <div key={month}>
                      <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                        {monthLabel}
                      </h3>
                      <ul className="space-y-2">
                        {(monthEntries ?? []).map((e) => (
                          <li key={e.id}>
                            <Link
                              href={`/app/journal/${e.id}`}
                              className="text-stone-700 dark:text-stone-300 hover:underline"
                            >
                              {e.entry_date} — {e.reference}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
