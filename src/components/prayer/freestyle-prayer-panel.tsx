"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { recordFreestylePrayerSession } from "@/app/actions/prayer-wheel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GrowthCopyTone } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function FreestylePrayerPanel({
  copyTone: _copyTone = "accountability",
}: {
  copyTone?: GrowthCopyTone;
}) {
  void _copyTone;
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "active" | "note">("idle");
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (phase !== "active" || startedAtRef.current == null) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current!) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  function start() {
    setError(null);
    setNote("");
    startedAtRef.current = Date.now();
    setElapsed(0);
    setPhase("active");
  }

  function endToNote() {
    if (startedAtRef.current == null) return;
    const sec = Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));
    setElapsed(sec);
    setPhase("note");
  }

  function dismissNote() {
    setNote("");
    setPhase("idle");
    startedAtRef.current = null;
    setElapsed(0);
  }

  function saveSession(includeNote: boolean) {
    setError(null);
    const sec = elapsed;
    if (sec < 1) {
      dismissNote();
      return;
    }
    const n = includeNote ? note.trim() : "";
    startTransition(async () => {
      const res = await recordFreestylePrayerSession(sec, n.length > 0 ? n : null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      dismissNote();
      router.refresh();
    });
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        phase === "active" && "ring-1 ring-violet-300/40 dark:ring-violet-600/30"
      )}
    >
      <h2 className="text-lg font-serif font-light text-foreground">Freestyle prayer</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pray freely with a simple timer. When you finish, your time is saved as prayer activity for
        today—no minimum length.
      </p>

      {phase === "idle" ? (
        <div className="mt-6 flex flex-col items-center gap-4">
          <Button type="button" size="lg" className="min-w-[200px]" onClick={start}>
            Start prayer
          </Button>
        </div>
      ) : null}

      {phase === "active" ? (
        <div className="mt-6 flex flex-col items-center gap-6">
          <p
            className="font-mono text-4xl tabular-nums tracking-tight text-violet-700 dark:text-violet-300"
            aria-live="polite"
          >
            {formatElapsed(elapsed)}
          </p>
          <p className="text-center text-sm text-muted-foreground">Stay as long as you like.</p>
          <Button type="button" variant="secondary" onClick={endToNote}>
            End prayer
          </Button>
        </div>
      ) : null}

      {phase === "note" ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-foreground">
            Saved · {formatElapsed(elapsed)}. Anything you want to remember from this time?{" "}
            <span className="text-muted-foreground">(optional)</span>
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A word, a name, a verse…"
            rows={3}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={() => saveSession(true)}>
              {pending ? "Saving…" : "Save note"}
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => saveSession(false)}>
              Skip
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
