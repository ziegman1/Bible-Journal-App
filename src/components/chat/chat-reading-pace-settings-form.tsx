"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateChatGroupReadingPace } from "@/app/actions/chat-reading-pace";
import type { ChatReadingPaceSettings } from "@/app/actions/chat-reading-pace";
import { BIBLE_BOOKS, getBookById } from "@/lib/scripture/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChatReadingPaceSettingsForm({
  groupId,
  initial,
}: {
  groupId: string;
  initial: ChatReadingPaceSettings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [readingStartDate, setReadingStartDate] = useState(initial.reading_start_date);
  const [chaptersPerDay, setChaptersPerDay] = useState(String(initial.chapters_per_day));
  const [planBookId, setPlanBookId] = useState(initial.plan_start_book_id);
  const [planChapter, setPlanChapter] = useState(String(initial.plan_start_chapter));

  const book = useMemo(() => getBookById(planBookId), [planBookId]);
  const maxCh = book?.chapterCount ?? 1;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cpd = parseInt(chaptersPerDay, 10);
    const pch = parseInt(planChapter, 10);
    startTransition(async () => {
      const res = await updateChatGroupReadingPace(groupId, {
        readingStartDate,
        chaptersPerDay: cpd,
        planStartBookId: planBookId,
        planStartChapter: pch,
      });
      if ("error" in res) {
        setError(res.error ?? "Could not save settings");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        These settings apply to the whole group. Each person&apos;s pace meter uses their own SOAPS
        bookmark vs this schedule.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pace-start">Reading start date</Label>
          <Input
            id="pace-start"
            type="date"
            value={readingStartDate}
            onChange={(e) => setReadingStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace-cpd">Chapters per day (agreement)</Label>
          <Select
            value={chaptersPerDay}
            onValueChange={(v) => {
              if (v) setChaptersPerDay(v);
            }}
          >
            <SelectTrigger id="pace-cpd" className="w-full">
              <SelectValue placeholder="Chapters per day" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} per day
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pace-book">Plan starts at (book)</Label>
          <Select
            value={planBookId}
            onValueChange={(v) => {
              if (v) setPlanBookId(v);
            }}
          >
            <SelectTrigger id="pace-book" className="w-full">
              <SelectValue placeholder="Book" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {BIBLE_BOOKS.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace-ch">Starting chapter</Label>
          <Input
            id="pace-ch"
            type="number"
            min={1}
            max={maxCh}
            value={planChapter}
            onChange={(e) => setPlanChapter(e.target.value)}
            required
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving…" : "Save pace settings"}
      </Button>
    </form>
  );
}
