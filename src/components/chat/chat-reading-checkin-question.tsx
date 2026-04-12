"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getChatReadingCheckinForWeek,
  submitChatReadingCheckIn,
} from "@/app/actions/chat-reading-checkin";
import { BIBLE_BOOKS, getBookById } from "@/lib/scripture/books";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChatReadingCheckinQuestion({
  groupId,
  questionText,
}: {
  groupId: string;
  questionText: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [keptUp, setKeptUp] = useState<boolean | null>(null);
  const [restartBookId, setRestartBookId] = useState(BIBLE_BOOKS[0]!.id);
  const [restartChapter, setRestartChapter] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getChatReadingCheckinForWeek(groupId);
      if (cancelled) return;
      if ("error" in r) {
        setHydrated(true);
        return;
      }
      if (r.row) {
        setKeptUp(r.row.kept_up);
        if (!r.row.kept_up && r.row.restart_book_id) {
          setRestartBookId(r.row.restart_book_id);
          if (r.row.restart_chapter != null) {
            setRestartChapter(String(r.row.restart_chapter));
          }
        }
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const book = useMemo(() => getBookById(restartBookId), [restartBookId]);
  const maxCh = book?.chapterCount ?? 1;

  useEffect(() => {
    const ch = parseInt(restartChapter, 10);
    if (Number.isFinite(ch) && ch > maxCh) {
      setRestartChapter(String(maxCh));
    }
  }, [maxCh, restartChapter]);

  function onPickYes() {
    setKeptUp(true);
    setError(null);
  }

  function onPickNo() {
    setKeptUp(false);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (keptUp === null) {
      setError("Choose Yes or No.");
      return;
    }
    const keptUpNow = keptUp;
    startTransition(async () => {
      const res = await submitChatReadingCheckIn({
        groupId,
        keptUp: keptUpNow,
        restartBookId: keptUpNow ? undefined : restartBookId,
        restartChapter: keptUpNow ? undefined : parseInt(restartChapter, 10),
      });
      if ("error" in res && res.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      if ("success" in res) {
        if (res.warning) {
          toast.message("Check-in saved", { description: res.warning });
        } else if (res.graceApplied) {
          toast.success("Reading restart saved. Your group pace was realigned together.");
        } else if (res.skippedDuplicateWeek) {
          toast.success(
            "Answer saved. The pair was already realigned this week—no second grace reset."
          );
        } else {
          toast.success("Answer saved.");
        }
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="font-medium text-stone-900 dark:text-stone-100">{questionText}</p>
      {!hydrated ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 pt-0.5" role="group" aria-label="Reading check-in">
            <Button
              type="button"
              size="sm"
              variant={keptUp === true ? "default" : "outline"}
              onClick={onPickYes}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={keptUp === false ? "default" : "outline"}
              onClick={onPickNo}
            >
              No
            </Button>
          </div>

          {keptUp === false ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 dark:bg-muted/15">
              <p className="text-sm text-muted-foreground">
                Where are you picking back up? This becomes the shared restart for your pair&apos;s
                reading plan (last chapter you finished).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`restart-book-${groupId}`}>Book</Label>
                  <Select value={restartBookId} onValueChange={(v) => v && setRestartBookId(v)}>
                    <SelectTrigger id={`restart-book-${groupId}`} className="w-full bg-background">
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
                <div className="space-y-1.5">
                  <Label htmlFor={`restart-ch-${groupId}`}>Chapter</Label>
                  <Select value={restartChapter} onValueChange={(v) => v && setRestartChapter(v)}>
                    <SelectTrigger id={`restart-ch-${groupId}`} className="w-full bg-background">
                      <SelectValue placeholder="Chapter" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: maxCh }, (_, i) => String(i + 1)).map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" size="sm" disabled={pending || keptUp === null}>
            {pending ? "Saving…" : "Save answer"}
          </Button>
        </>
      )}
    </form>
  );
}
