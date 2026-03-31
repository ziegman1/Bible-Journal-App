"use client";

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AskAIPanel } from "./ask-ai-panel";
import { VerseActionMenu } from "./verse-action-menu";
import { InlinePassageReflectionForm } from "./inline-passage-reflection-form";
import { ChapterSelector } from "./chapter-selector";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createHighlight, deleteHighlight } from "@/app/actions/highlights";
import { addFavoritePassage, removeFavoritePassage } from "@/app/actions/favorites";
import { saveReadingSession } from "@/app/actions/journal";
import { recordChatSoapsChapterComplete } from "@/app/actions/chat-soaps-progress";
import { toast } from "sonner";
import type { Chapter } from "@/lib/scripture/types";
import { readStoredScrollY, writeStoredScrollY } from "@/lib/reading-scroll-storage";
import {
  countChapterWords,
  minVisibleReadMsForChapter,
  READING_WPM,
  SCROLL_BOTTOM_ROOT_MARGIN_PX,
} from "@/lib/reading/chapter-reading-rules";

function subscribeIsMobile(callback: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeIsMobile,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}

export interface ReaderChapterNavLink {
  href: string;
  label: string;
}

interface ReaderViewProps {
  chapter: Chapter;
  bookId: string;
  bookName: string;
  chapterNum: number;
  chapterCount: number;
  /** When true (e.g. ?resume=1 from Continue reading), restore saved scroll for this chapter. */
  resumeScroll?: boolean;
  prevChapterNav?: ReaderChapterNavLink | null;
  nextChapterNav?: ReaderChapterNavLink | null;
  /**
   * When set (?chatSoapsGroup=… from dashboard CHAT SOAPS), saving SOAPS here updates
   * per-group reading progress only for this flow.
   */
  chatSoapsGroupId?: string | null;
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
  chapterCount,
  resumeScroll = false,
  prevChapterNav = null,
  nextChapterNav = null,
  chatSoapsGroupId = null,
  aiStyle = "balanced",
  initialHighlights = new Set(),
  initialHighlightIds = new Map(),
  initialFavorites = new Map(),
}: ReaderViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [anchorVerse, setAnchorVerse] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"ask" | "reflection">("ask");
  const [keyboardInsetPx, setKeyboardInsetPx] = useState(0);
  const [highlights, setHighlights] = useState<Set<number>>(initialHighlights);
  const [highlightIds, setHighlightIds] = useState<Map<number, string>>(initialHighlightIds);
  const [favorites, setFavorites] = useState<Map<number, string>>(initialFavorites);
  const [passageOffsetTop, setPassageOffsetTop] = useState<number>(0);
  const [leftContentHeight, setLeftContentHeight] = useState<number>(0);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const rightHeaderRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef(false);
  const [rightHeaderHeight, setRightHeaderHeight] = useState<number>(0);

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

  // Mobile keyboard avoidance: use VisualViewport to pad scroll areas above keyboard.
  useEffect(() => {
    if (!isMobile || !panelOpen) {
      setKeyboardInsetPx(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) {
      setKeyboardInsetPx(0);
      return;
    }

    const update = () => {
      // Height lost to keyboard (and browser UI) relative to layout viewport.
      const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop ?? 0));
      setKeyboardInsetPx(Math.min(500, Math.round(inset)));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [isMobile, panelOpen]);

  // Measure right panel header height (for alignment offset)
  useEffect(() => {
    if (!rightHeaderRef.current) return;
    const ro = new ResizeObserver(() => {
      if (rightHeaderRef.current) {
        setRightHeaderHeight(rightHeaderRef.current.offsetHeight);
      }
    });
    ro.observe(rightHeaderRef.current);
    setRightHeaderHeight(rightHeaderRef.current.offsetHeight);
    return () => ro.disconnect();
  }, [panelOpen]);

  // Measure passage offset and scroll into view when panel opens with a selection
  useEffect(() => {
    if (!panelOpen || !selectedRange || !leftScrollRef.current || !articleRef.current) return;
    const verseEl = articleRef.current.querySelector(`[data-verse="${selectedRange.start}"]`) as HTMLElement | null;
    if (!verseEl) return;
    const scrollContainer = leftScrollRef.current;
    const verseRect = verseEl.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const verseOffset = verseRect.top - containerRect.top + scrollContainer.scrollTop;
    setPassageOffsetTop(Math.max(0, verseOffset));
    setLeftContentHeight(scrollContainer.scrollHeight);
    isScrollingRef.current = true;
    verseEl.scrollIntoView({ behavior: "smooth", block: "start" });
    const rightEl = rightScrollRef.current;
    const headerH = rightHeaderRef.current?.offsetHeight ?? 0;
    if (panelMode !== "ask") {
      if (rightEl) {
        requestAnimationFrame(() => {
          rightEl.scrollTop = 0;
          isScrollingRef.current = false;
        });
      } else {
        isScrollingRef.current = false;
      }
      return;
    }
    const adjustedOffset = Math.max(0, verseOffset - headerH);
    if (rightEl) {
      requestAnimationFrame(() => {
        rightEl.scrollTop = adjustedOffset;
        isScrollingRef.current = false;
      });
    } else {
      isScrollingRef.current = false;
    }
  }, [panelOpen, selectedRange, panelMode]);

  // Sync scroll between left and right panels on desktop (only when form is visible)
  useEffect(() => {
    if (isMobile || !panelOpen || !selectedRange || panelMode !== "ask") return;
    const leftEl = leftScrollRef.current;
    const rightEl = rightScrollRef.current;
    const headerH = rightHeaderHeight;
    if (!leftEl || !rightEl) return;
    function onLeftScroll() {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      rightEl!.scrollTop = Math.max(0, leftEl!.scrollTop - headerH);
      requestAnimationFrame(() => { isScrollingRef.current = false; });
    }
    function onRightScroll() {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      leftEl!.scrollTop = rightEl!.scrollTop + headerH;
      requestAnimationFrame(() => { isScrollingRef.current = false; });
    }
    leftEl.addEventListener("scroll", onLeftScroll);
    rightEl.addEventListener("scroll", onRightScroll);
    return () => {
      leftEl.removeEventListener("scroll", onLeftScroll);
      rightEl.removeEventListener("scroll", onRightScroll);
    };
  }, [isMobile, panelOpen, selectedRange, rightHeaderHeight, panelMode]);

  // SOAPS uses the same scroll container as Ask AI; reset so Scripture (first field) isn’t above the fold.
  useEffect(() => {
    if (!panelOpen || panelMode !== "reflection") return;
    const el = rightScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [panelOpen, panelMode, selectedRange?.start]);

  // Window / main scroll to top when changing chapter (inner column handled after isEmpty).
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) main.scrollTop = 0;
  }, [bookId, chapterNum]);

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

  const chapterWordCount = isEmpty ? 0 : countChapterWords(chapter);
  const minVisibleMs = isEmpty ? 0 : minVisibleReadMsForChapter(chapterWordCount);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const savedThisVisitRef = useRef(false);
  /** CHAT SOAPS bookmark persisted to server for this chapter visit */
  const chatSoapsPersistedRef = useRef(false);
  const chatSoapsFlushInFlightRef = useRef(false);
  /** Latest reader state for pagehide / visibility (avoid stale listeners) */
  const chatSoapsSnapRef = useRef({
    groupId: "" as string,
    bookId: "",
    chapter: 0,
    reachedEnd: false,
    dwellMet: false,
  });
  const [reachedChapterEnd, setReachedChapterEnd] = useState(false);
  const [visibleElapsedMs, setVisibleElapsedMs] = useState(0);
  const [savingRead, setSavingRead] = useState(false);
  const [hasRecordedRead, setHasRecordedRead] = useState(false);

  const timeRequirementMet = visibleElapsedMs >= minVisibleMs;
  const canRecordReading =
    !isEmpty && reachedChapterEnd && timeRequirementMet && !savingRead;
  const remainingMs = Math.max(0, minVisibleMs - visibleElapsedMs);

  useEffect(() => {
    setReachedChapterEnd(false);
    setVisibleElapsedMs(0);
    setHasRecordedRead(false);
    savedThisVisitRef.current = false;
    chatSoapsPersistedRef.current = false;
    chatSoapsFlushInFlightRef.current = false;
  }, [bookId, chapterNum]);

  chatSoapsSnapRef.current = {
    groupId: chatSoapsGroupId ?? "",
    bookId,
    chapter: chapterNum,
    reachedEnd: reachedChapterEnd,
    dwellMet: timeRequirementMet,
  };

  const persistChatSoapsBookmark = useCallback(
    async (opts: { requireDwell: boolean; showSaving: boolean }): Promise<boolean> => {
      if (!chatSoapsGroupId) return true;
      if (chatSoapsPersistedRef.current) return true;
      if (!reachedChapterEnd) return false;
      if (opts.requireDwell && !timeRequirementMet) return false;
      if (opts.showSaving) setSavingRead(true);
      const out = await recordChatSoapsChapterComplete(
        chatSoapsGroupId,
        bookId,
        chapterNum
      );
      if (opts.showSaving) setSavingRead(false);
      if ("error" in out) {
        if (opts.showSaving) toast.error(out.error);
        return false;
      }
      chatSoapsPersistedRef.current = true;
      setHasRecordedRead(true);
      savedThisVisitRef.current = true;
      return true;
    },
    [
      chatSoapsGroupId,
      reachedChapterEnd,
      timeRequirementMet,
      bookId,
      chapterNum,
    ]
  );

  /** Auto-save bookmark when chapter is fully “read” (end + dwell), same bar as mark-read */
  useEffect(() => {
    if (!chatSoapsGroupId || isEmpty || !canRecordReading || hasRecordedRead) return;
    if (chatSoapsPersistedRef.current) return;
    let cancelled = false;
    void (async () => {
      const ok = await persistChatSoapsBookmark({
        requireDwell: true,
        showSaving: false,
      });
      if (cancelled || !ok) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [
    chatSoapsGroupId,
    isEmpty,
    canRecordReading,
    hasRecordedRead,
    persistChatSoapsBookmark,
  ]);

  /** If the user reaches the chapter end then closes the tab/app, persist bookmark (bottom reached; dwell optional on exit) */
  useEffect(() => {
    if (!chatSoapsGroupId) return;

    const flushOnLeave = () => {
      const s = chatSoapsSnapRef.current;
      if (!s.groupId || chatSoapsPersistedRef.current || chatSoapsFlushInFlightRef.current)
        return;
      if (!s.reachedEnd) return;
      chatSoapsFlushInFlightRef.current = true;
      void recordChatSoapsChapterComplete(s.groupId, s.bookId, s.chapter).then(
        (out) => {
          chatSoapsFlushInFlightRef.current = false;
          if ("error" in out) return;
          chatSoapsPersistedRef.current = true;
          setHasRecordedRead(true);
          savedThisVisitRef.current = true;
        }
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushOnLeave();
    };
    window.addEventListener("pagehide", flushOnLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushOnLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [chatSoapsGroupId]);

  useEffect(() => {
    if (isEmpty) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setVisibleElapsedMs((ms) => ms + 250);
      }
    }, 250);
    return () => clearInterval(id);
  }, [isEmpty, bookId, chapterNum]);

  useEffect(() => {
    if (isEmpty) return;
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    const setup = () => {
      if (cancelled) return;
      const root = leftScrollRef.current;
      const target = bottomSentinelRef.current;
      if (!root || !target) {
        requestAnimationFrame(setup);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setReachedChapterEnd(true);
          }
        },
        {
          root,
          rootMargin: `0px 0px ${SCROLL_BOTTOM_ROOT_MARGIN_PX}px 0px`,
          threshold: 0,
        }
      );
      io.observe(target);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(setup));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [isEmpty, bookId, chapterNum, chapter.verses.length]);

  const recordReadingAndMaybeNavigate = useCallback(
    async (navigateHref: string | null) => {
      if (isEmpty) return;
      if (!reachedChapterEnd || !timeRequirementMet) return;
      if (savedThisVisitRef.current) {
        if (navigateHref) router.push(navigateHref);
        return;
      }
      setSavingRead(true);
      if (chatSoapsGroupId) {
        const ok = await persistChatSoapsBookmark({
          requireDwell: true,
          showSaving: true,
        });
        setSavingRead(false);
        if (!ok) return;
        if (navigateHref) {
          toast.success("Opening next chapter");
          router.push(navigateHref);
        } else {
          toast.success("SOAPS reading bookmark updated");
        }
        return;
      }
      const result = await saveReadingSession(
        bookName,
        chapterNum,
        null,
        null,
        `${bookName} ${chapterNum}`
      );
      setSavingRead(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      savedThisVisitRef.current = true;
      setHasRecordedRead(true);
      toast.success(
        navigateHref ? "Reading saved — opening next chapter" : "Chapter marked as read"
      );
      if (navigateHref) router.push(navigateHref);
    },
    [
      isEmpty,
      reachedChapterEnd,
      timeRequirementMet,
      bookName,
      chapterNum,
      router,
      chatSoapsGroupId,
      persistChatSoapsBookmark,
    ]
  );

  useEffect(() => {
    const el = leftScrollRef.current;
    if (!el || isEmpty) return;
    let cancelled = false;
    const apply = () => {
      if (cancelled || !el) return;
      if (resumeScroll) {
        const y = readStoredScrollY(bookId, chapterNum);
        if (y != null) {
          const maxY = Math.max(0, el.scrollHeight - el.clientHeight);
          el.scrollTop = Math.min(y, maxY);
          return;
        }
      }
      el.scrollTop = 0;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapterNum, resumeScroll, isEmpty]);

  useEffect(() => {
    const el = leftScrollRef.current;
    if (!el || isEmpty) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        writeStoredScrollY(bookId, chapterNum, el.scrollTop);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [bookId, chapterNum, isEmpty]);

  useEffect(() => {
    const el = leftScrollRef.current;
    if (!el || isEmpty) return;
    const flush = () => writeStoredScrollY(bookId, chapterNum, el.scrollTop);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [bookId, chapterNum, isEmpty]);

  const selectedVerses =
    selectedRange && panelOpen
      ? chapter.verses.filter(
          (x) =>
            x.verse >= selectedRange.start && x.verse <= selectedRange.end
        )
      : [];

  const passageTextContent =
    selectedVerses.length > 0 ? (
      <>
        {selectedVerses.map((sv) => (
          <p key={sv.verse} className="mb-1">
            <span className="text-stone-400 dark:text-stone-500 font-sans text-sm mr-2">
              {sv.verse}
            </span>
            {sv.text}
          </p>
        ))}
      </>
    ) : null;

  const formatReadingTimeRemaining = () => {
    if (remainingMs <= 0) return "";
    const sec = Math.ceil(remainingMs / 1000);
    if (sec < 90) return `${sec} seconds`;
    const min = Math.ceil(sec / 60);
    return `${min} minute${min === 1 ? "" : "s"}`;
  };

  const nextLinkClass =
    "text-sm text-stone-600 dark:text-stone-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline";

  const headerNext =
    !nextChapterNav ? null : isEmpty || hasRecordedRead ? (
      <Link href={nextChapterNav.href} className={nextLinkClass}>
        Next →
      </Link>
    ) : (
      <button
        type="button"
        disabled={!canRecordReading || savingRead}
        title={
          !reachedChapterEnd
            ? "Scroll to the end of the chapter first"
            : !timeRequirementMet
              ? `Keep reading — about ${formatReadingTimeRemaining()} left at ${READING_WPM} words/min`
              : undefined
        }
        onClick={() => recordReadingAndMaybeNavigate(nextChapterNav.href)}
        className={nextLinkClass}
      >
        {savingRead ? "Saving…" : "Next →"}
      </button>
    );

  const bottomNext =
    !nextChapterNav ? null : isEmpty || hasRecordedRead ? (
      <Link
        href={nextChapterNav.href}
        className="text-base font-medium text-stone-700 underline-offset-4 hover:underline dark:text-stone-200"
      >
        {nextChapterNav.label} →
      </Link>
    ) : (
      <button
        type="button"
        disabled={!canRecordReading || savingRead}
        title={
          !reachedChapterEnd
            ? "Scroll to the end of the chapter first"
            : !timeRequirementMet
              ? `About ${formatReadingTimeRemaining()} left at ${READING_WPM} words/min`
              : undefined
        }
        onClick={() => recordReadingAndMaybeNavigate(nextChapterNav.href)}
        className="text-base font-medium text-stone-700 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline dark:text-stone-200"
      >
        {savingRead ? "Saving…" : `${nextChapterNav.label} →`}
      </button>
    );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/app/read"
            className="text-sm text-stone-600 dark:text-stone-400 hover:underline shrink-0"
          >
            ← Books
          </Link>
          <h1 className="text-lg font-serif font-light text-stone-800 dark:text-stone-200 truncate">
            {bookName} {chapterNum}
          </h1>
          <ChapterSelector
            bookId={bookId}
            bookName={bookName}
            currentChapter={chapterNum}
            chapterCount={chapterCount}
            chatSoapsGroupId={chatSoapsGroupId}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {prevChapterNav && (
            <Link
              href={prevChapterNav.href}
              className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
            >
              ← Prev
            </Link>
          )}
          {headerNext}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
      <div ref={leftScrollRef} className="flex-1 overflow-auto px-4 py-8 md:px-12 md:py-12">
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
            <>
              <article
                ref={articleRef}
                className="font-serif text-[1.1rem] md:text-[1.2rem] leading-[1.9] text-stone-800 dark:text-stone-200"
              >
                {chapter.verses.map((v) => {
                  const isHighlighted = highlights.has(v.verse);
                  const isFavorited = favorites.has(v.verse);
                  const isSelected =
                    selectedVerse === v.verse ||
                    (selectedRange &&
                      v.verse >= selectedRange.start &&
                      v.verse <= selectedRange.end);

                  return (
                    <span key={v.verse} data-verse={v.verse} className="block">
                      <VerseActionMenu
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
                    </span>
                  );
                })}
                <div
                  ref={bottomSentinelRef}
                  className="h-1 w-full shrink-0"
                  aria-hidden
                />
              </article>
              <section
                className="mt-10 flex flex-col items-center gap-4 border-t border-stone-200 pt-10 text-center dark:border-stone-700"
                aria-labelledby="chapter-read-heading"
              >
                <h2 id="chapter-read-heading" className="sr-only">
                  Complete this chapter
                </h2>
                <div className="max-w-md space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  {!reachedChapterEnd && (
                    <p>
                      Scroll to the <strong>end of this chapter</strong> to unlock recording
                      it as read.
                    </p>
                  )}
                  {reachedChapterEnd && !timeRequirementMet && (
                    <p aria-live="polite">
                      Keep this tab in view for about{" "}
                      <strong>{formatReadingTimeRemaining()}</strong> longer. Time is estimated
                      from this chapter’s length at a typical{" "}
                      <strong>{READING_WPM} words per minute</strong> so progress reflects real
                      reading time.
                    </p>
                  )}
                  {canRecordReading && !hasRecordedRead && (
                    <p className="text-stone-700 dark:text-stone-300">
                      You can mark this chapter as read with the button below or use{" "}
                      <strong>Next</strong> to save and continue.
                    </p>
                  )}
                  {hasRecordedRead && (
                    <p className="text-stone-700 dark:text-stone-300">
                      Reading recorded. Use <strong>Next</strong> when you are ready to continue.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="lg"
                  disabled={!canRecordReading || savingRead || hasRecordedRead}
                  title={
                    hasRecordedRead
                      ? "Already recorded for this visit"
                      : !reachedChapterEnd
                        ? "Scroll to the end of the chapter first"
                        : !timeRequirementMet
                          ? `About ${formatReadingTimeRemaining()} left`
                          : undefined
                  }
                  className="min-w-[min(100%,280px)]"
                  onClick={() => recordReadingAndMaybeNavigate(null)}
                >
                  {savingRead
                    ? "Saving…"
                    : hasRecordedRead
                      ? "Chapter recorded"
                      : "Finish chapter & complete reading"}
                </Button>
              </section>
            </>
          )}
          {(prevChapterNav || nextChapterNav) && (
            <nav
              className="mt-12 flex flex-col gap-4 border-t border-stone-200 pt-8 pb-4 dark:border-stone-700 sm:flex-row sm:items-center sm:justify-between"
              aria-label="Previous and next chapter"
            >
              <div className="min-h-[1.5rem]">
                {prevChapterNav ? (
                  <Link
                    href={prevChapterNav.href}
                    className="text-base font-medium text-stone-700 underline-offset-4 hover:underline dark:text-stone-200"
                  >
                    ← {prevChapterNav.label}
                  </Link>
                ) : null}
              </div>
              <div className="min-h-[1.5rem] text-left sm:text-right">{bottomNext}</div>
            </nav>
          )}
        </div>
      </div>

      <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border flex flex-col bg-sidebar shrink-0">
        <div ref={rightHeaderRef} className="p-4 border-b border-border shrink-0">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Passage actions
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {passageRef}
          </p>
        </div>
        <div ref={rightScrollRef} className="flex-1 overflow-auto min-h-0">
          {panelOpen && selectedRange ? (
            panelMode === "reflection" ? (
              <div className="p-4">
                <div className="space-y-3">
                  <InlinePassageReflectionForm
                    reference={passageRef}
                    bookName={bookName}
                    bookId={bookId}
                    chapter={chapterNum}
                    verseStart={selectedRange?.start ?? null}
                    verseEnd={selectedRange?.end ?? null}
                    passageText={passageTextContent ?? undefined}
                    chatSoapsGroupId={chatSoapsGroupId ?? undefined}
                    compact
                    onClose={() => setPanelOpen(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setPanelMode("ask")}
                    className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
                  >
                    Ask AI about this passage instead →
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="min-h-full"
                style={{ minHeight: leftContentHeight > 0 ? leftContentHeight : undefined }}
              >
                <div
                  style={{
                    height: Math.max(0, passageOffsetTop - rightHeaderHeight),
                    minHeight: 0,
                  }}
                  aria-hidden
                />
                <div className="p-4">
                  <div className="flex flex-col min-h-0">
                    <AskAIPanel
                      bookId={bookId}
                      bookName={bookName}
                      chapter={chapterNum}
                      verseStart={selectedRange?.start ?? null}
                      verseEnd={selectedRange?.end ?? null}
                      reference={passageRef}
                      passageText={panelOpen ? passageTextContent ?? undefined : undefined}
                      open={isMobile ? false : panelOpen}
                      onOpenChange={setPanelOpen}
                      aiStyle={aiStyle}
                      defaultToReflection={false}
                    />
                    {panelOpen && (
                      <button
                        type="button"
                        onClick={() => setPanelMode("reflection")}
                        className="p-4 pt-0 text-sm text-stone-600 dark:text-stone-400 hover:underline"
                      >
                        Add SOAPS instead →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <AskAIPanel
              bookId={bookId}
              bookName={bookName}
              chapter={chapterNum}
              verseStart={selectedRange?.start ?? null}
              verseEnd={selectedRange?.end ?? null}
              reference={passageRef}
              passageText={undefined}
              open={false}
              onOpenChange={setPanelOpen}
              aiStyle={aiStyle}
              defaultToReflection={false}
            />
          )}
        </div>
      </aside>
      </div>

      {isMobile && (
        <Sheet
          open={panelOpen}
          onOpenChange={(open) => {
            if (!open) setPanelOpen(false);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-[100dvh] max-h-[100dvh] overflow-hidden rounded-none sm:rounded-t-xl pt-[env(safe-area-inset-top)]"
            showCloseButton={true}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-border px-4 py-3">
                <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {panelMode === "reflection" ? "SOAPS" : "Ask AI"} — {passageRef}
                </h2>
              </div>
              {panelMode === "reflection" ? (
                <>
                  <div className="shrink-0 border-b border-border px-4 py-3 bg-background">
                    <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      Selected passage
                    </h3>
                    <div className="mt-2 max-h-[20dvh] overflow-y-auto pr-1 text-stone-600 dark:text-stone-400 text-sm font-serif leading-relaxed">
                      {passageTextContent ?? (
                        <p className="text-xs font-sans text-stone-500 dark:text-stone-500">
                          Select a verse range to display it here.
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex-1 min-h-0 overflow-y-auto px-4"
                    style={{
                      paddingBottom: `calc(max(2rem, env(safe-area-inset-bottom)) + ${keyboardInsetPx}px)`,
                      scrollPaddingBottom: `calc(max(2rem, env(safe-area-inset-bottom)) + ${keyboardInsetPx}px)`,
                    }}
                  >
                    <div className="min-h-0 py-3">
                      <InlinePassageReflectionForm
                        reference={passageRef}
                        bookName={bookName}
                        bookId={bookId}
                        chapter={chapterNum}
                        verseStart={selectedRange?.start ?? null}
                        verseEnd={selectedRange?.end ?? null}
                        passageText={undefined}
                        chatSoapsGroupId={chatSoapsGroupId ?? undefined}
                        compact
                        onClose={() => setPanelOpen(false)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="flex-1 min-h-0 overflow-y-auto px-4"
                  style={{
                    paddingBottom: `calc(max(2rem, env(safe-area-inset-bottom)) + ${keyboardInsetPx}px)`,
                    scrollPaddingBottom: `calc(max(2rem, env(safe-area-inset-bottom)) + ${keyboardInsetPx}px)`,
                  }}
                >
                  <div className="py-3">
                    <AskAIPanel
                      bookId={bookId}
                      bookName={bookName}
                      chapter={chapterNum}
                      verseStart={selectedRange?.start ?? null}
                      verseEnd={selectedRange?.end ?? null}
                      reference={passageRef}
                      passageText={passageTextContent ?? undefined}
                      open={true}
                      onOpenChange={setPanelOpen}
                      aiStyle={aiStyle}
                      defaultToReflection={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
