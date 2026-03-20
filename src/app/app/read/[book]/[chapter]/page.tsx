import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getChapter } from "@/lib/scripture/provider";
import { getBookById } from "@/lib/scripture/books";
import { ReaderView } from "@/components/reader-view";
import { SaveReadingSession } from "@/components/save-reading-session";
import { ChapterSelector } from "@/components/chapter-selector";
import { listHighlights } from "@/app/actions/highlights";
import { listFavoritePassages } from "@/app/actions/favorites";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { book: bookId, chapter: chapterStr } = await params;
  const chapterNum = parseInt(chapterStr, 10);
  if (isNaN(chapterNum) || chapterNum < 1) notFound();

  const book = getBookById(bookId);
  if (!book) notFound();

  const chapter = await getChapter(bookId, chapterNum);
  if (!chapter) notFound();

  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("ai_style").eq("id", user.id).single()
    : { data: null };

  const [{ highlights }, { favorites }] = await Promise.all([
    listHighlights(book.name, chapterNum),
    listFavoritePassages(),
  ]);

  const chapterHighlights = (highlights ?? []).filter(
    (h) => h.book === book.name && h.chapter === chapterNum
  );
  const highlightedVerses = new Set(chapterHighlights.map((h) => h.verse));
  const highlightIdsByVerse = new Map(chapterHighlights.map((h) => [h.verse, h.id]));
  const favoriteByVerse = new Map<number, string>();
  (favorites ?? []).forEach((f) => {
    if (f.book === book.name && f.chapter === chapterNum && f.verse_start === f.verse_end) {
      favoriteByVerse.set(f.verse_start, f.id);
    }
  });

  const prevChapter =
    chapterNum > 1
      ? { href: `/app/read/${bookId}/${chapterNum - 1}`, label: `${book.name} ${chapterNum - 1}` }
      : null;
  const nextChapter =
    chapterNum < book.chapterCount
      ? { href: `/app/read/${bookId}/${chapterNum + 1}`, label: `${book.name} ${chapterNum + 1}` }
      : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <SaveReadingSession
        book={book.name}
        chapter={chapterNum}
        verseStart={null}
        verseEnd={null}
        reference={`${book.name} ${chapterNum}`}
      />
      <div className="border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/app/read"
            className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
          >
            ← Books
          </Link>
          <h1 className="text-lg font-serif font-light text-stone-800 dark:text-stone-200">
            {book.name} {chapterNum}
          </h1>
          <ChapterSelector
            bookId={bookId}
            bookName={book.name}
            currentChapter={chapterNum}
            chapterCount={book.chapterCount}
          />
        </div>
        <div className="flex gap-2">
          {prevChapter && (
            <Link
              href={prevChapter.href}
              className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              ← Prev
            </Link>
          )}
          {nextChapter && (
            <Link
              href={nextChapter.href}
              className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              Next →
            </Link>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <ReaderView
          chapter={chapter}
          bookId={bookId}
          bookName={book.name}
          chapterNum={chapterNum}
          aiStyle={(profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced"}
          initialHighlights={highlightedVerses}
          initialHighlightIds={highlightIdsByVerse}
          initialFavorites={favoriteByVerse}
        />
      </div>
    </div>
  );
}
