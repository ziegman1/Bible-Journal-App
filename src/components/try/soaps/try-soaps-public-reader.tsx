"use client";

import Link from "next/link";
import { BadwrLogo } from "@/components/badwr-logo";
import { ReaderView } from "@/components/reader-view";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Chapter } from "@/lib/scripture/types";
import { cn } from "@/lib/utils";

type Props = {
  chapter: Chapter;
  bookId: string;
  bookName: string;
  chapterNum: number;
  chapterCount: number;
  signupConversionHref: string;
};

/**
 * Public try SOAPS: real {@link ReaderView} + {@link InlinePassageReflectionForm} (public persistence mode).
 */
export function TrySoapsPublicReader({
  chapter,
  bookId,
  bookName,
  chapterNum,
  chapterCount,
  signupConversionHref,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="min-w-0 max-w-2xl space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Try SOAPS</p>
          <p className="text-sm leading-snug text-muted-foreground">
            Read and tap verses like in the app—open SOAPS, fill the same fields, then finish when you are ready. No
            account needed until you want to save.
          </p>
        </div>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 gap-2 px-2")}>
          <BadwrLogo variant="compact" />
          <span className="sr-only">BADWR home</span>
        </Link>
      </div>
      <ReaderView
        chapter={chapter}
        bookId={bookId}
        bookName={bookName}
        chapterNum={chapterNum}
        chapterCount={chapterCount}
        resumeScroll={false}
        prevChapterNav={null}
        nextChapterNav={null}
        chatSoapsGroupId={null}
        aiStyle="balanced"
        initialHighlights={new Set()}
        initialHighlightIds={new Map()}
        initialFavorites={new Map()}
        publicTry={{ signupConversionHref }}
        publicTryBooksLink={{ href: "/", label: "← BADWR" }}
      />
    </div>
  );
}
