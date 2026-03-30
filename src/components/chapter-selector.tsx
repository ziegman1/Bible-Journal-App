"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChapterSelectorProps {
  bookId: string;
  bookName: string;
  currentChapter: number;
  chapterCount: number;
  /** Preserve CHAT SOAPS reader mode when switching chapters. */
  chatSoapsGroupId?: string | null;
}

export function ChapterSelector({
  bookId,
  bookName: _bookName,
  currentChapter,
  chapterCount,
  chatSoapsGroupId = null,
}: ChapterSelectorProps) {
  const router = useRouter();

  const readPath = (chapter: number) => {
    const base = `/app/read/${bookId}/${chapter}`;
    if (!chatSoapsGroupId) return base;
    return `${base}?chatSoapsGroup=${encodeURIComponent(chatSoapsGroupId)}`;
  };

  return (
    <Select
      value={String(currentChapter)}
      onValueChange={(v) => {
        if (v == null) return;
        const ch = parseInt(String(v), 10);
        router.push(readPath(ch));
      }}
    >
      <SelectTrigger className="w-[100px] h-8 text-sm">
        <SelectValue placeholder="Chapter" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => (
          <SelectItem key={ch} value={String(ch)}>
            Ch. {ch}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
