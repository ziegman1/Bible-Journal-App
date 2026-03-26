import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ThemesPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .order("name");

  const entryCounts = await Promise.all(
    (tags ?? []).map(async (tag) => {
      const { count } = await supabase
        .from("journal_entry_tags")
        .select("id", { count: "exact", head: true })
        .eq("tag_id", tag.id);
      return { tagId: tag.id, slug: tag.slug, name: tag.name, count: count ?? 0 };
    })
  );

  const sorted = entryCounts.sort((a, b) => b.count - a.count);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200 mb-2">
        Themes
      </h1>
      <p className="text-stone-600 dark:text-stone-400 mb-6">
        Recurring themes from your journal. Click to see related entries.
      </p>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-stone-500 dark:text-stone-400 space-y-4">
          <p>No themes yet.</p>
          <p className="text-sm">
            Add tags when saving journal entries to see recurring themes here.
          </p>
          <Link
            href="/app/read"
            className="inline-block text-sm text-stone-700 dark:text-stone-300 underline"
          >
            Read and journal →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map(({ tagId, slug, name, count }) => (
            <Link key={tagId} href={`/app/journal?tag=${slug}`}>
              <Card className="hover:bg-muted/60 dark:hover:bg-muted/40 transition-colors h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {count} {count === 1 ? "entry" : "entries"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
