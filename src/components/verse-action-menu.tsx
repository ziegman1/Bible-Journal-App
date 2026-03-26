"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  BookMarked,
  Highlighter,
  Star,
  MousePointer2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VerseActionMenuProps {
  verse: number;
  reference: string;
  bookName: string;
  bookId: string;
  chapter: number;
  isHighlighted: boolean;
  isFavorited: boolean;
  onAskAI: () => void;
  onAddReflection: () => void;
  onHighlight: () => void;
  onFavorite: () => void;
  /** When true, next verse tap completes range instead of opening menu */
  isRangeSelectionMode?: boolean;
  /** Called when user shift+clicks (desktop) to extend selection */
  onExtendRange?: (verse: number, e: React.MouseEvent) => void;
  /** Called when user taps verse in range mode to complete selection */
  onCompleteRange?: (verse: number) => void;
  /** Called when user chooses "Select range" to enter range mode (verse is the anchor) */
  onStartRangeSelection?: (verse: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function VerseActionMenu({
  verse,
  isHighlighted,
  isFavorited,
  onAskAI,
  onAddReflection,
  onHighlight,
  onFavorite,
  isRangeSelectionMode = false,
  onExtendRange,
  onCompleteRange,
  onStartRangeSelection,
  children,
}: VerseActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleClickCapture(e: React.MouseEvent) {
    // Don't intercept clicks on toolbar buttons — let them handle their own onClick
    if (e.target instanceof HTMLElement && e.target.closest("button")) {
      return;
    }
    if (e.shiftKey && onExtendRange) {
      e.preventDefault();
      e.stopPropagation();
      onExtendRange(verse, e);
      return;
    }
    if (isRangeSelectionMode && onCompleteRange) {
      e.preventDefault();
      e.stopPropagation();
      onCompleteRange(verse);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  }

  return (
    <span ref={containerRef} onClickCapture={handleClickCapture} className="inline-block w-full">
      <span className="cursor-pointer">{children}</span>
      {open && (
        <div className="flex flex-wrap items-center gap-1 mt-1 mb-2 py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onAskAI();
            }}
          >
            <MessageCircle className="size-3.5 shrink-0 mr-1" />
            Ask AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onAddReflection();
            }}
          >
            <BookMarked className="size-3.5 shrink-0 mr-1" />
            SOAPS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs", isHighlighted && "text-amber-600")}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onHighlight();
            }}
          >
            <Highlighter className="size-3.5 shrink-0 mr-1" />
            {isHighlighted ? "Unhighlight" : "Highlight"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs", isFavorited && "text-amber-600")}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onFavorite();
            }}
          >
            <Star
              className={cn("size-3.5 shrink-0 mr-1", isFavorited && "fill-amber-500")}
            />
            {isFavorited ? "Unfavorite" : "Favorite"}
          </Button>
          {onStartRangeSelection && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onStartRangeSelection(verse);
              }}
            >
              <MousePointer2 className="size-3.5 shrink-0 mr-1" />
              Select range
            </Button>
          )}
        </div>
      )}
    </span>
  );
}
