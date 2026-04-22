import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrySoapsPublicReader } from "@/components/try/soaps/try-soaps-public-reader";
import { getBookById } from "@/lib/scripture/books";
import { getChapter } from "@/lib/scripture/provider";

export const metadata: Metadata = {
  title: "Try SOAPS",
  description:
    "Use the same Scripture reader and SOAPS panel as BADWR—no account required. Finish when you are ready, then sign up to save.",
  robots: { index: true, follow: true },
};

/** Default first-touch chapter for public try (full text via configured Bible provider). */
const TRY_SOAPS_BOOK_ID = "john";
const TRY_SOAPS_CHAPTER = 15;

export default async function TrySoapsPage() {
  const book = getBookById(TRY_SOAPS_BOOK_ID);
  if (!book) notFound();

  const chapter = await getChapter(TRY_SOAPS_BOOK_ID, TRY_SOAPS_CHAPTER);
  if (!chapter) notFound();

  const signupConversionHref = `/signup?redirectTo=${encodeURIComponent("/app/soaps")}`;

  return (
    <TrySoapsPublicReader
      chapter={chapter}
      bookId={TRY_SOAPS_BOOK_ID}
      bookName={book.name}
      chapterNum={TRY_SOAPS_CHAPTER}
      chapterCount={book.chapterCount}
      signupConversionHref={signupConversionHref}
    />
  );
}
