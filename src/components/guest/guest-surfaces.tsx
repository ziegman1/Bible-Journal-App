"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button-variants";
import { CHAT_CONTENT } from "@/content/chatContent";
import { cn } from "@/lib/utils";

const SM_KEY = "badwr_guest_scripture_memory_demo";
const SHARE_KEY = "badwr_guest_share_encounters";
function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function GuestChatHub() {
  return (
    <div className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="mb-2 text-2xl font-serif font-light text-foreground">{CHAT_CONTENT.pageTitle}</h1>
      <p className="mb-6 text-muted-foreground">{CHAT_CONTENT.pageOverview}</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guest preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Real CHAT groups sync to your account. As a guest you can read this overview; start a group after you sign
            up.
          </p>
          <Link href="/signup?fromGuest=1" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
            Create account
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function GuestScriptureMemoryHub() {
  const [mem, setMem] = useState(0);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const s = readJson(SM_KEY, { mem: 0, rev: 0 });
    setMem(s.mem);
    setRev(s.rev);
  }, []);

  function persist(nextMem: number, nextRev: number) {
    setMem(nextMem);
    setRev(nextRev);
    writeJson(SM_KEY, { mem: nextMem, rev: nextRev });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-16">
      <div>
        <h1 className="text-2xl font-serif font-light text-foreground">Scripture Memory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guest preview — counts below stay in this browser only and never update your real streaks.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today (demo)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground">New memorized</p>
            <p className="text-2xl font-semibold tabular-nums">{mem}</p>
            <Button type="button" size="sm" className="mt-2" onClick={() => persist(mem + 1, rev)}>
              +1 (local)
            </Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="text-2xl font-semibold tabular-nums">{rev}</p>
            <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => persist(mem, rev + 1)}>
              +1 review (local)
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Lists, SRS scheduling, and settings require an account.{" "}
        <Link href="/signup?fromGuest=1" className="font-medium text-foreground underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}

type Encounter = { id: string; when: string; note: string };

export function GuestShareHub() {
  const [rows, setRows] = useState<Encounter[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setRows(readJson(SHARE_KEY, []));
  }, []);

  function persist(next: Encounter[]) {
    setRows(next);
    writeJson(SHARE_KEY, next);
  }

  function add() {
    const trimmed = note.trim();
    if (!trimmed) return;
    persist([
      ...rows,
      { id: crypto.randomUUID(), when: new Date().toISOString().slice(0, 10), note: trimmed },
    ]);
    setNote("");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-serif font-light text-foreground">Share</h1>
      <p className="text-sm text-muted-foreground">
        Log practice encounters locally. Nothing is sent to BADWR servers until you create an account.
      </p>
      <div className="space-y-2">
        <Label htmlFor="guest-share-note">Encounter note</Label>
        <Textarea
          id="guest-share-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Who, what you shared, how it went…"
        />
        <Button type="button" onClick={add}>
          Save locally
        </Button>
      </div>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted-foreground">No local entries yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card/60 p-3 text-sm">
              <span className="text-xs text-muted-foreground">{r.when}</span>
              <p className="mt-1 whitespace-pre-wrap">{r.note}</p>
            </li>
          ))
        )}
      </ul>
      <Link href="/signup?fromGuest=1" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
        Create account to sync
      </Link>
    </div>
  );
}

