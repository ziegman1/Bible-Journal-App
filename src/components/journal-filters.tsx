"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useJournalFilter } from "@/components/journal-filter-context";

interface JournalFiltersProps {
  books: string[];
  tags: { id: string; name: string; slug: string }[];
  currentBook?: string;
  currentTag?: string;
  currentMonth?: string;
  currentSearch?: string;
}

export function JournalFilters({
  books,
  tags,
  currentBook,
  currentTag,
  currentMonth,
  currentSearch,
}: JournalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterContext = useJournalFilter();
  const updateParams = filterContext?.updateParams ?? ((updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    router.push(`/app/journal?${next.toString()}`);
  });
  const isPending = filterContext?.isPending ?? false;

  const hasFilters = currentBook || currentTag || currentMonth || currentSearch;

  const months: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 1; m <= 12; m++) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }

  const monthLabels: Record<string, string> = {};
  months.forEach((m) => {
    const [y, mo] = m.split("-");
    const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1);
    monthLabels[m] = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  });

  return (
    <div className={`flex flex-wrap gap-3 mb-8 transition-opacity duration-200 ${isPending ? "opacity-70" : ""}`}>
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <Input
          placeholder="Search entries..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length === 0 || v.length > 2) {
              updateParams({ q: v || undefined });
            }
          }}
          onBlur={(e) => updateParams({ q: e.target.value || undefined })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ q: (e.target as HTMLInputElement).value || undefined });
            }
          }}
          className="pl-9"
        />
      </div>
      <Select
        value={currentBook ?? "all"}
        onValueChange={(v) => updateParams({ book: v === "all" || v == null ? undefined : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Book" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All books</SelectItem>
          {books.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentTag ?? "all"}
        onValueChange={(v) => updateParams({ tag: v === "all" || v == null ? undefined : v })}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={t.slug}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentMonth ?? "all"}
        onValueChange={(v) => updateParams({ month: v === "all" || v == null ? undefined : v })}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All months</SelectItem>
          {months.slice(0, 24).map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabels[m] ?? m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/app/journal")}
          className="text-stone-500"
        >
          <X className="size-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
