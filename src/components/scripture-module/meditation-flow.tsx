"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { saveMemorizeContext } from "@/app/actions/scripture-module";
import {
  SCRIPTURE_READING_TEXT,
  SCRIPTURE_SHELL_FIELD,
  SCRIPTURE_TRAINING_META,
  SCRIPTURE_TRAINING_STEP,
  ScriptureTrainingShell,
} from "@/components/scripture-module/scripture-training-shell";
import type { GripMemoryDTO, ScriptureItemDTO } from "@/lib/scripture-module/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function MeditationFlow({
  item,
  memory: initialMemory,
}: {
  item: ScriptureItemDTO;
  memory: GripMemoryDTO;
}) {
  const router = useRouter();
  const [memory, setMemory] = useState(initialMemory);
  const [paraphrase, setParaphrase] = useState(initialMemory.memorizeParaphrase ?? "");
  const [meaning, setMeaning] = useState(initialMemory.memorizeMeaning ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pending, startTransition] = useTransition();

  const isDone = memory.memorizeStage === "completed" || memory.gripStatus === "completed";

  useEffect(() => {
    setMemory(initialMemory);
  }, [initialMemory.id, initialMemory.lastStepAt, initialMemory.memorizeParaphrase, initialMemory.memorizeMeaning]);

  useEffect(() => {
    setParaphrase(initialMemory.memorizeParaphrase ?? "");
    setMeaning(initialMemory.memorizeMeaning ?? "");
  }, [initialMemory.memorizeParaphrase, initialMemory.memorizeMeaning]);

  const refreshFromServer = useCallback(() => {
    router.refresh();
  }, [router]);

  function onSave() {
    setError(null);
    setSavedFlash(false);
    const p = paraphrase.trim();
    const m = meaning.trim();
    if (!p || !m) {
      setError("Add both a paraphrase and a short meaning before saving.");
      return;
    }
    startTransition(async () => {
      const res = await saveMemorizeContext(item.id, p, m);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMemory((prev) => ({
        ...prev,
        memorizeParaphrase: p,
        memorizeMeaning: m,
      }));
      setSavedFlash(true);
      refreshFromServer();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Meditation
          </p>
          <h1 className="text-xl font-serif font-light text-foreground">{item.reference}</h1>
          {item.translation ? (
            <p className="text-sm text-muted-foreground">{item.translation}</p>
          ) : null}
        </div>
        <Link
          href={`/scripture/items/${item.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Back to verse
        </Link>
      </div>

      <ScriptureTrainingShell>
        {error ? (
          <p
            className="mb-5 rounded-md border border-red-500/35 bg-red-950/40 px-3 py-2.5 text-sm text-red-100/95"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {savedFlash ? (
          <p className="mb-5 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100/95">
            Saved.
          </p>
        ) : null}

        <header className="mb-6 space-y-2 border-b border-white/[0.06] pb-5">
          <p className={SCRIPTURE_TRAINING_STEP}>Reflect</p>
          <h2 className="font-serif text-lg font-light tracking-tight text-slate-100/95">
            Paraphrase and meaning
          </h2>
          <p className={SCRIPTURE_TRAINING_META}>
            Put the passage in your own words and note what it means for you. You can return here anytime;
            it&apos;s separate from phrase practice and typed recall.
          </p>
        </header>

        {item.reference?.trim() ? (
          <p className="mb-3 font-serif text-sm text-slate-500/85">{item.reference.trim()}</p>
        ) : null}

        <blockquote
          className={cn(
            SCRIPTURE_READING_TEXT,
            "mb-8 border-l-2 border-sky-500/20 pl-4 text-slate-200/95"
          )}
        >
          {item.verseText}
        </blockquote>

        <div className="space-y-2">
          <Label htmlFor="med-paraphrase" className="text-slate-300">
            Paraphrase
          </Label>
          <Textarea
            id="med-paraphrase"
            rows={4}
            value={paraphrase}
            onChange={(e) => setParaphrase(e.target.value)}
            disabled={isDone}
            placeholder="In my own words, this passage is saying…"
            className={cn("resize-y", SCRIPTURE_SHELL_FIELD)}
          />
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="med-meaning" className="text-slate-300">
            Meaning
          </Label>
          <Textarea
            id="med-meaning"
            rows={3}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            disabled={isDone}
            placeholder="A sentence or two on what it means for you…"
            className={cn("resize-y", SCRIPTURE_SHELL_FIELD)}
          />
        </div>

        {!isDone ? (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.06] pt-6">
            <Button
              type="button"
              className="bg-sky-600 text-white hover:bg-sky-500"
              onClick={onSave}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save meditation"}
            </Button>
          </div>
        ) : (
          <p className={cn(SCRIPTURE_TRAINING_META, "mt-8 border-t border-white/[0.06] pt-6")}>
            Memorization is complete; you can still read what you saved above.
          </p>
        )}

        <p className={cn(SCRIPTURE_TRAINING_META, "mt-6 border-t border-white/[0.06] pt-6")}>
          <Link href={`/scripture/items/${item.id}/memorize`} className="text-slate-200 underline underline-offset-4">
            Memorize &amp; practice
          </Link>
        </p>
      </ScriptureTrainingShell>
    </div>
  );
}
