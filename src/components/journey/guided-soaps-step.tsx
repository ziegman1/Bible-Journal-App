"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { completeLinearSoapsStep, recordLinearSoapsShareIntent } from "@/app/actions/linear-journey";
import { ShareViaEmailTextButtons } from "@/components/entry-share";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LinearDiscipleshipStepKey } from "@/lib/app-experience-mode/linear-discipleship-path";
import {
  GUIDED_SOAPS_SHARE_GATE_MESSAGE,
  GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE,
} from "@/lib/guided-journey/latest-soaps-readiness";

export function GuidedSoapsStep({
  stepKey,
  title,
  soapsReaderHref,
  soapsReadyForShare,
  soapsReadyForComplete,
  shareChannelRecorded,
}: {
  stepKey: Extract<LinearDiscipleshipStepKey, "soaps_1" | "soaps_2" | "soaps_3">;
  title: string;
  soapsReaderHref: string;
  /** From server: latest journal row has Scripture, observation, application, and prayer. */
  soapsReadyForShare: boolean;
  /** From server: latest journal row is a full SOAPS entry including Share. */
  soapsReadyForComplete: boolean;
  /** Optional: share channel was used on this step (does not unlock progression). */
  shareChannelRecorded: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareBody = useMemo(
    () =>
      [
        `BADWR Guided Journey — ${title}`,
        "",
        "I'm practicing SOAPS (Scripture, Observation, Application, Prayer, Share) as part of my discipleship path.",
        "",
        "Sent from BADWR.",
      ].join("\n"),
    [title]
  );

  async function onMarkComplete() {
    setError(null);
    if (!soapsReadyForComplete) {
      setError(GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE);
      return;
    }
    setPending(true);
    const res = await completeLinearSoapsStep(stepKey);
    setPending(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.replace(`/app/journey?from=${encodeURIComponent(stepKey)}`);
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/guided-soaps-step.tsx — #1");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/40 p-6 shadow-sm dark:border-sky-900/35 dark:from-stone-950 dark:via-sky-950/20 dark:to-blue-950/15 sm:p-8">
        <h2 className="font-serif text-xl font-light text-stone-900 dark:text-stone-100">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Open Scripture and complete a full SOAPS entry. Every letter must be saved in your journal:{" "}
          <strong className="text-stone-800 dark:text-stone-200">Scripture</strong> (transcribed),{" "}
          <strong className="text-stone-800 dark:text-stone-200">Observation</strong>,{" "}
          <strong className="text-stone-800 dark:text-stone-200">Application</strong>,{" "}
          <strong className="text-stone-800 dark:text-stone-200">Prayer</strong>, and{" "}
          <strong className="text-stone-800 dark:text-stone-200">Share</strong> (who or how you will pass
          truth on).
        </p>
        <Link
          href={soapsReaderHref}
          className={cn(
            "mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-300/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-sky-950",
            "shadow-sm hover:bg-sky-50 dark:border-sky-800/60 dark:bg-stone-950/60 dark:text-sky-100 dark:hover:bg-sky-950/40"
          )}
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Open today’s SOAPS
        </Link>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-900/30 sm:p-8">
        <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
          Share on this step
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          After Scripture, observation, application, and prayer are saved on your latest journal entry,
          share from here the same way you do on lessons. Completing this step still requires every SOAPS
          field—including Share—in that saved entry (checked on the server).
        </p>
        <div className="mt-4">
          <ShareViaEmailTextButtons
            subject={`BADWR Guided Journey — ${title}`}
            body={shareBody}
            disabled={!soapsReadyForShare}
            beforeShareNavigate={async () => {
              const res = await recordLinearSoapsShareIntent(stepKey);
              if ("error" in res && res.error) {
                setError(res.error);
                return false;
              }
              setError(null);
              console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/guided-soaps-step.tsx — #2");
              router.refresh();
              return true;
            }}
          />
        </div>
        {!soapsReadyForShare ? (
          <p className="mt-3 text-xs text-muted-foreground">{GUIDED_SOAPS_SHARE_GATE_MESSAGE}</p>
        ) : shareChannelRecorded ? (
          <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Share channel opened for this step.
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Share via Text or Email when you are ready—then ensure your journal entry includes the Share
            line so you can mark this step complete.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-6 dark:border-stone-800 dark:bg-stone-950/40 sm:p-8">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Checklist</h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>Save your entry from the reader when every SOAPS field is filled.</li>
          <li>Optional: use Share via Text or Email on this page after the first four fields are saved.</li>
          <li>Return here and mark this step complete only when your latest entry is complete on the server.</li>
        </ul>

        {error && <p className="mt-6 text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {soapsReadyForComplete
              ? "Your latest journal entry includes all five SOAPS fields. You can mark this step complete."
              : GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE}
          </p>
          <Button
            type="button"
            className="min-h-11 w-full shrink-0 sm:w-auto"
            disabled={pending || !soapsReadyForComplete}
            onClick={onMarkComplete}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Checking…
              </span>
            ) : (
              "Mark SOAPS step complete"
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
