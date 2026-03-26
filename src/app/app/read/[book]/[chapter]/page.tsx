import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChapter } from "@/lib/scripture/provider";
import { getBookById } from "@/lib/scripture/books";
import { ReaderView, type ReaderChapterNavLink } from "@/components/reader-view";
import { listHighlights } from "@/app/actions/highlights";
import { listFavoritePassages } from "@/app/actions/favorites";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ resume?: string }>;
}

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { book: bookId, chapter: chapterStr } = await params;
  const { resume: resumeParam } = await searchParams;
  const resumeScroll =
    resumeParam === "1" ||
    resumeParam === "true" ||
    resumeParam === "yes";
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

  const prevChapter: ReaderChapterNavLink | null =
    chapterNum > 1
      ? { href: `/app/read/${bookId}/${chapterNum - 1}`, label: `${book.name} ${chapterNum - 1}` }
      : null;
  const nextChapter: ReaderChapterNavLink | null =
    chapterNum < book.chapterCount
      ? { href: `/app/read/${bookId}/${chapterNum + 1}`, label: `${book.name} ${chapterNum + 1}` }
      : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ReaderView
        chapter={chapter}
        bookId={bookId}
        bookName={book.name}
        chapterNum={chapterNum}
        chapterCount={book.chapterCount}
        resumeScroll={resumeScroll}
        prevChapterNav={prevChapter}
        nextChapterNav={nextChapter}
        aiStyle={(profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced"}
        initialHighlights={highlightedVerses}
        initialHighlightIds={highlightIdsByVerse}
        initialFavorites={favoriteByVerse}
      />
    </div>
  );
}
