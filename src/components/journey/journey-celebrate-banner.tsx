"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JourneyCelebrateBanner({ message }: { message: string | null }) {
  const router = useRouter();
  const dismiss = useCallback(() => {
    router.replace("/app/journey");
  }, [router]);

  if (!message) return null;

  return (
    <div
      className="mb-8 rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/25"
      role="status"
    >
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">Step complete</p>
          <p className="text-sm leading-relaxed text-emerald-900/95 dark:text-emerald-100/90">{message}</p>
          <Button type="button" variant="secondary" size="sm" className="min-h-9" onClick={dismiss}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
