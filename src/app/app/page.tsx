import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBookIdFromName } from "@/lib/scripture/books";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageCircle, BookMarked } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const currentYear = new Date().getFullYear();

  const [
    { data: lastSession },
    { data: recentEntries },
    { data: recentAI },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("book, chapter, reference, read_at")
      .eq("user_id", user.id)
      .order("read_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("journal_entries")
      .select("id, reference, entry_date, user_question, user_reflection")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("ai_responses")
      .select("id, reference, question, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("journal_year").eq("id", user.id).single(),
  ]);

  const journalYear = profile?.journal_year ?? currentYear;

  const [
    { count: booksCount },
    { count: chaptersCount },
    { count: questionsCount },
    { count: reflectionsCount },
  ] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("book", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("read_at", `${journalYear}-01-01`)
      .lte("read_at", `${journalYear}-12-31`),
    supabase
      .from("reading_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("read_at", `${journalYear}-01-01`)
      .lte("read_at", `${journalYear}-12-31`),
    supabase
      .from("ai_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${journalYear}-01-01`)
      .lte("created_at", `${journalYear}-12-31T23:59:59`),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("year", journalYear),
  ]);

  const { data: sessionsForYear } = await supabase
    .from("reading_sessions")
    .select("book")
    .eq("user_id", user.id)
    .gte("read_at", `${journalYear}-01-01`)
    .lte("read_at", `${journalYear}-12-31`);
  const booksTouched = [...new Set(sessionsForYear?.map((s) => s.book) ?? [])].length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Your Scripture Journey
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {journalYear} in review
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <BookOpen className="size-4" />
              Books touched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{booksTouched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <BookOpen className="size-4" />
              Chapters read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{chaptersCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <MessageCircle className="size-4" />
              Questions asked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{questionsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
              <BookMarked className="size-4" />
              Reflections written
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">{reflectionsCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BookOpen className="size-4" />
              Continue reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastSession ? (
              <div className="space-y-3">
                <p className="text-stone-700 dark:text-stone-300">
                  {lastSession.reference}
                </p>
                <Link
                  href={`/app/read/${getBookIdFromName(lastSession.book) ?? lastSession.book.toLowerCase().replace(/\s+/g, "")}/${lastSession.chapter}`}
                >
                  <Button size="sm">Continue</Button>
                </Link>
              </div>
            ) : (
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Start your first reading
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BookMarked className="size-4" />
              Recent journal entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntries && recentEntries.length > 0 ? (
              <ul className="space-y-2">
                {recentEntries.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/app/journal/${e.id}`}
                      className="text-sm text-stone-700 dark:text-stone-300 hover:underline"
                    >
                      {e.reference} — {e.entry_date}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                No journal entries yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageCircle className="size-4" />
            Recent AI questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAI && recentAI.length > 0 ? (
            <ul className="space-y-2">
              {recentAI.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="text-stone-600 dark:text-stone-400">
                    {a.reference}:
                  </span>{" "}
                  {a.question?.slice(0, 60)}
                  {a.question && a.question.length > 60 ? "…" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              No AI questions yet. Select a passage and ask!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
