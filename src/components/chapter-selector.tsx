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
}

export function ChapterSelector({
  bookId,
  bookName,
  currentChapter,
  chapterCount,
}: ChapterSelectorProps) {
  const router = useRouter();

  return (
    <Select
      value={String(currentChapter)}
      onValueChange={(v) => {
        if (v == null) return;
        const ch = parseInt(String(v), 10);
        router.push(`/app/read/${bookId}/${ch}`);
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
