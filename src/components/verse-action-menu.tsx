"use client";

import {
  MessageCircle,
  BookMarked,
  Highlighter,
  Star,
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
  children,
  className,
}: VerseActionMenuProps) {
  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
