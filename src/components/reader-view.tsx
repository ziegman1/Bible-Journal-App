"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { AskAIPanel } from "./ask-ai-panel";
import { VerseActionMenu } from "./verse-action-menu";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { createHighlight, deleteHighlight } from "@/app/actions/highlights";
import { addFavoritePassage, removeFavoritePassage } from "@/app/actions/favorites";
import { toast } from "sonner";
import type { Chapter } from "@/lib/scripture/types";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface ReaderViewProps {
  chapter: Chapter;
  bookId: string;
  bookName: string;
  chapterNum: number;
  aiStyle?: "concise" | "balanced" | "in-depth";
  initialHighlights?: Set<number>;
  initialHighlightIds?: Map<number, string>;
  initialFavorites?: Map<number, string>;
}

export function ReaderView({
  chapter,
  bookId,
  bookName,
  chapterNum,
  aiStyle = "balanced",
  initialHighlights = new Set(),
  initialHighlightIds = new Map(),
  initialFavorites = new Map(),
}: ReaderViewProps) {
  const isMobile = useIsMobile();
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [anchorVerse, setAnchorVerse] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"ask" | "reflection">("ask");
  const [highlights, setHighlights] = useState<Set<number>>(initialHighlights);
  const [highlightIds, setHighlightIds] = useState<Map<number, string>>(initialHighlightIds);
  const [favorites, setFavorites] = useState<Map<number, string>>(initialFavorites);

  const passageRef =
    selectedRange && selectedRange.start === selectedRange.end
      ? `${bookName} ${chapterNum}:${selectedRange.start}`
      : selectedRange
        ? `${bookName} ${chapterNum}:${selectedRange.start}-${selectedRange.end}`
        : `${bookName} ${chapterNum}`;

  const handleAskAI = useCallback(() => {
    setPanelMode("ask");
    setPanelOpen(true);
  }, []);

  const handleAddReflection = useCallback(() => {
    setPanelMode("reflection");
    setPanelOpen(true);
  }, []);

  const handleExtendRange = useCallback(
    (verse: number) => {
      setSelectedRange((prev) => {
        const start = prev ? Math.min(prev.start, verse) : verse;
        const end = prev ? Math.max(prev.end, verse) : verse;
        return { start, end };
      });
      setSelectedVerse(verse);
      toast.success("Range extended. Shift+click another verse to extend further.");
    },
    []
  );

  const handleCompleteRange = useCallback((verse: number) => {
    if (anchorVerse === null) return;
    const start = Math.min(anchorVerse, verse);
    const end = Math.max(anchorVerse, verse);
    setSelectedRange({ start, end });
    setSelectedVerse(verse);
    setAnchorVerse(null);
    setPanelMode("reflection");
    setPanelOpen(true);
    toast.success(`Selected ${start === end ? "verse" : "verses"} ${start}${start === end ? "" : `–${end}`}`);
  }, [anchorVerse]);

  const handleStartRangeSelection = useCallback((verse: number) => {
    setAnchorVerse(verse);
    setSelectedVerse(verse);
    setSelectedRange({ start: verse, end: verse });
    setPanelOpen(false);
    toast.success("Tap another verse to select range");
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  const handleHighlight = useCallback(
    async (verse: number) => {
      const reference = `${bookName} ${chapterNum}:${verse}`;
      const isHighlighted = highlights.has(verse);
      const highlightId = highlightIds.get(verse);

      if (isHighlighted && highlightId) {
        const result = await deleteHighlight(highlightId);
        if (result?.error) toast.error(result.error);
        else {
          setHighlights((prev) => {
            const next = new Set(prev);
            next.delete(verse);
            return next;
          });
          setHighlightIds((prev) => {
            const next = new Map(prev);
            next.delete(verse);
            return next;
          });
          toast.success("Highlight removed");
        }
      } else if (!isHighlighted) {
        const result = await createHighlight({
          book: bookName,
          chapter: chapterNum,
          verse,
          reference,
          color: "yellow",
        });
        if (result?.error) toast.error(result.error);
        else if (result.highlight?.id) {
          setHighlights((prev) => new Set(prev).add(verse));
          setHighlightIds((prev) => new Map(prev).set(verse, result.highlight!.id));
          toast.success("Verse highlighted");
        }
      }
    },
    [bookName, chapterNum, highlights, highlightIds]
  );

  const handleFavorite = useCallback(
    async (verse: number) => {
      const reference = `${bookName} ${chapterNum}:${verse}`;
      const favoriteId = favorites.get(verse);

      if (favoriteId) {
        const result = await removeFavoritePassage(favoriteId);
        if (result?.error) toast.error(result.error);
        else {
          setFavorites((prev) => {
            const next = new Map(prev);
            next.delete(verse);
            return next;
          });
          toast.success("Removed from favorites");
        }
      } else {
        const result = await addFavoritePassage({
          book: bookName,
          chapter: chapterNum,
          verseStart: verse,
          verseEnd: verse,
          reference,
        });
        if (result?.error) toast.error(result.error);
        else if (result.favorite?.id) {
          setFavorites((prev) => new Map(prev).set(verse, result.favorite!.id));
          toast.success("Added to favorites");
        }
      }
    },
    [bookName, chapterNum, favorites]
  );

  const isEmpty =
    chapter.verses.length === 0 ||
    chapter.verses.some((v) =>
      v.text?.includes?.("[Verse") && v.text?.includes?.("placeholder")
    );

  return (
    <div className="flex flex-1 min-h-0 flex-col md:flex-row">
      <div className="flex-1 overflow-auto px-4 py-8 md:px-12 md:py-12">
        <div className="max-w-2xl mx-auto">
          {isEmpty ? (
            <div className="text-center py-16 px-4">
              <p className="text-stone-500 dark:text-stone-400 text-lg font-serif">
                This chapter is not yet available.
              </p>
              <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">
                Connect a licensed Bible API to display the full text.
              </p>
              <Link
                href="/app/read"
                className="inline-block mt-6 text-sm text-stone-600 dark:text-stone-400 hover:underline"
              >
                ← Choose another book
              </Link>
            </div>
          ) : (
            <article className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] text-stone-800 dark:text-stone-200">
              {chapter.verses.map((v) => {
                const isHighlighted = highlights.has(v.verse);
                const isFavorited = favorites.has(v.verse);
                const isSelected =
                  selectedVerse === v.verse ||
                  (selectedRange && v.verse >= selectedRange.start && v.verse <= selectedRange.end);

                return (
                  <VerseActionMenu
                    key={v.verse}
                    verse={v.verse}
                    reference={`${bookName} ${chapterNum}:${v.verse}`}
                    bookName={bookName}
                    bookId={bookId}
                    chapter={chapterNum}
                    isHighlighted={isHighlighted}
                    isFavorited={isFavorited}
                    isRangeSelectionMode={anchorVerse !== null}
                    onExtendRange={handleExtendRange}
                    onCompleteRange={handleCompleteRange}
                    onStartRangeSelection={handleStartRangeSelection}
                    onAskAI={() => {
                      setSelectedVerse(v.verse);
                      setSelectedRange({ start: v.verse, end: v.verse });
                      setAnchorVerse(null);
                      handleAskAI();
                    }}
                    onAddReflection={() => {
                      setSelectedVerse(v.verse);
                      setSelectedRange({ start: v.verse, end: v.verse });
                      setAnchorVerse(null);
                      handleAddReflection();
                    }}
                    onHighlight={() => handleHighlight(v.verse)}
                    onFavorite={() => handleFavorite(v.verse)}
                  >
                    <span
                      className={`
                        inline-flex items-baseline gap-2 py-0.5 px-0.5 -mx-0.5 rounded transition-colors
                        hover:bg-stone-100 dark:hover:bg-stone-800/50
                        ${isSelected ? "bg-amber-50 dark:bg-amber-900/20" : ""}
                        ${isHighlighted ? "bg-amber-100/80 dark:bg-amber-900/30" : ""}
                      `}
                    >
                      <span className="text-stone-400 dark:text-stone-500 text-sm font-sans font-normal align-baseline select-none tabular-nums">
                        {v.verse}
                      </span>
                      <span>{v.text}</span>
                    </span>
                  </VerseActionMenu>
                );
              })}
            </article>
          )}
        </div>
      </div>

      <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 flex flex-col bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Passage actions
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {passageRef}
          </p>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          <AskAIPanel
            bookId={bookId}
            bookName={bookName}
            chapter={chapterNum}
            verseStart={selectedRange?.start ?? null}
            verseEnd={selectedRange?.end ?? null}
            reference={passageRef}
            open={isMobile ? false : panelOpen}
            onOpenChange={setPanelOpen}
            aiStyle={aiStyle}
            defaultToReflection={panelMode === "reflection"}
          />
        </div>
      </aside>

      {isMobile && (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-xl"
            showCloseButton={true}
          >
            <div className="pb-8">
              <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {panelMode === "reflection" ? "Add reflection" : "Ask AI"} — {passageRef}
              </h2>
              <AskAIPanel
                bookId={bookId}
                bookName={bookName}
                chapter={chapterNum}
                verseStart={selectedRange?.start ?? null}
                verseEnd={selectedRange?.end ?? null}
                reference={passageRef}
                open={true}
                onOpenChange={setPanelOpen}
                aiStyle={aiStyle}
                defaultToReflection={panelMode === "reflection"}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
