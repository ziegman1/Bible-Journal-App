"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { recordOikosPrayerVisit } from "@/app/actions/prayer-wheel";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import {
  formatOikosPrayerLine,
  OIKOS_PRAYER_TEMPLATES,
} from "@/lib/prayer/oikos-prayers";
import { cn } from "@/lib/utils";

export function OikosPrayerFlow({ names }: { names: string[] }) {
  const router = useRouter();
  const recordedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    startTransition(async () => {
      const res = await recordOikosPrayerVisit();
      if ("error" in res) {
        setVisitError(res.error);
        recordedRef.current = false;
        return;
      }
      router.refresh();
    });
  }, [router]);

  if (names.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Select up to 5 people from your List of 100 to pray for.
        </p>
        <Link
          href="/app/list-of-100"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
        >
          List of 100
        </Link>
      </div>
    );
  }

  const total = names.length;
  const current = Math.min(index, total - 1);
  const name = names[current] ?? "";
  const isLast = current >= total - 1;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-24 sm:px-6">
      {visitError ? (
        <p className="text-center text-sm text-destructive">{visitError}</p>
      ) : null}

      <p className="text-center text-sm font-medium text-foreground">
        Praying for {current + 1} of {total}
      </p>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-center text-lg font-medium text-foreground">{name}</p>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
          {OIKOS_PRAYER_TEMPLATES.map((template, i) => (
            <li key={i} className="pl-1">
              {formatOikosPrayerLine(template, name)}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          End session
        </button>
        {isLast ? (
          <Button
            type="button"
            className="w-full sm:w-auto sm:min-w-[140px]"
            onClick={() => router.push("/app")}
            disabled={pending}
          >
            Complete
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full sm:w-auto sm:min-w-[140px]"
            onClick={() => setIndex((n) => Math.min(n + 1, total - 1))}
            disabled={pending}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
