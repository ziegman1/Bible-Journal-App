import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChapter } from "@/lib/scripture/provider";
import { getBookById } from "@/lib/scripture/books";
import { ReaderView, type ReaderChapterNavLink } from "@/components/reader-view";
import { listHighlights } from "@/app/actions/highlights";
import { listFavoritePassages } from "@/app/actions/favorites";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ resume?: string; chatSoapsGroup?: string }>;
}

function appendChatSoapsQuery(href: string, groupId: string) {
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}chatSoapsGroup=${encodeURIComponent(groupId)}`;
}

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { book: bookId, chapter: chapterStr } = await params;
  const { resume: resumeParam, chatSoapsGroup: chatSoapsGroupParam } =
    await searchParams;
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

  let chatSoapsGroupId: string | null = null;
  const rawGroup = chatSoapsGroupParam?.trim();
  if (rawGroup && user) {
    const { data: grp } = await supabase
      .from("groups")
      .select("group_kind")
      .eq("id", rawGroup)
      .maybeSingle();
    const { data: mem } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", rawGroup)
      .eq("user_id", user.id)
      .maybeSingle();
    if (grp?.group_kind === "chat" && mem) {
      chatSoapsGroupId = rawGroup;
    }
  }

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

  const prevHref =
    chapterNum > 1 ? `/app/read/${bookId}/${chapterNum - 1}` : null;
  const nextHref =
    chapterNum < book.chapterCount ? `/app/read/${bookId}/${chapterNum + 1}` : null;

  const prevChapter: ReaderChapterNavLink | null =
    prevHref != null
      ? {
          href: chatSoapsGroupId
            ? appendChatSoapsQuery(prevHref, chatSoapsGroupId)
            : prevHref,
          label: `${book.name} ${chapterNum - 1}`,
        }
      : null;
  const nextChapter: ReaderChapterNavLink | null =
    nextHref != null
      ? {
          href: chatSoapsGroupId
            ? appendChatSoapsQuery(nextHref, chatSoapsGroupId)
            : nextHref,
          label: `${book.name} ${chapterNum + 1}`,
        }
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
        chatSoapsGroupId={chatSoapsGroupId}
        aiStyle={(profile?.ai_style as "concise" | "balanced" | "in-depth") ?? "balanced"}
        initialHighlights={highlightedVerses}
        initialHighlightIds={highlightIdsByVerse}
        initialFavorites={favoriteByVerse}
      />
    </div>
  );
}
