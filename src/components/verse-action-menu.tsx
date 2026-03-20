"use client";

import {
  MessageCircle,
  BookMarked,
  Highlighter,
  Star,
  MousePointer2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  reference,
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
  className,
}: VerseActionMenuProps) {
  function handleClickCapture(e: React.MouseEvent) {
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
  }

  return (
    <span onClickCapture={handleClickCapture} className="inline">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full text-left [&]:appearance-none [&]:bg-transparent [&]:border-none [&]:p-0 [&]:font-inherit [&]:cursor-pointer">
          {children}
        </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onAskAI();
          }}
        >
          <MessageCircle className="size-4 shrink-0" />
          Ask AI
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onAddReflection();
          }}
        >
          <BookMarked className="size-4 shrink-0" />
          Add Reflection
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onHighlight();
          }}
        >
          <Highlighter
            className={cn("size-4 shrink-0", isHighlighted && "text-amber-600")}
          />
          {isHighlighted ? "Remove highlight" : "Highlight"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            onFavorite();
          }}
        >
          <Star
            className={cn("size-4 shrink-0", isFavorited && "fill-amber-500 text-amber-600")}
          />
          {isFavorited ? "Remove favorite" : "Favorite"}
        </DropdownMenuItem>
        {onStartRangeSelection && (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              onStartRangeSelection(verse);
            }}
          >
            <MousePointer2 className="size-4 shrink-0" />
            Select range
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </span>
  );
}
