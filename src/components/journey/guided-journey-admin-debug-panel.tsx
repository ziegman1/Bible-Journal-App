"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminJourneyAdvanceExpectableStep,
  adminJourneyClearInvites,
  adminJourneyGoBackStep,
  adminJourneySeedSentInvites,
  adminJourneySkipSoapsDelay,
  resetGuidedJourney,
  setJourneyStep,
} from "@/app/actions/guided-journey-admin";
import { Button } from "@/components/ui/button";
import { LINEAR_DISCIPLESHIP_STEP_KEYS } from "@/lib/app-experience-mode/linear-discipleship-path";
import { toast } from "sonner";

export type GuidedJourneyAdminDebugSnapshot = {
  activeStepKey: string | null;
  displayStepIndex: number;
  completedKeys: string[];
  stepCompletedAt: Record<string, string>;
  sentInviteCount: number;
  delayBypassed: boolean;
  journeyEnabledForPublic: boolean;
};

export function GuidedJourneyAdminDebugPanel({ snapshot }: { snapshot: GuidedJourneyAdminDebugSnapshot }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [jumpKey, setJumpKey] = useState<string>(LINEAR_DISCIPLESHIP_STEP_KEYS[0] ?? "lesson_self_feeding");

  async function run(label: string, fn: () => Promise<{ error?: string; success?: boolean }>) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r && "error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    toast.success(`${label} ok`);
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/journey/guided-journey-admin-debug-panel.tsx — #1");
    router.refresh();
  }

  return (
    <div className="mt-12 rounded-lg border border-amber-500/40 bg-amber-50/90 p-4 text-stone-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-stone-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Admin — Guided Journey debug
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Public rollout: {snapshot.journeyEnabledForPublic ? "on" : "off"} · Delay bypass env:{" "}
        {snapshot.delayBypassed ? "on" : "off"}
      </p>
      <dl className="mt-3 grid gap-1 text-xs font-mono sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Active step</dt>
          <dd>{snapshot.activeStepKey ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Display index</dt>
          <dd>{snapshot.displayStepIndex}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Completed</dt>
          <dd className="break-all">{snapshot.completedKeys.length ? snapshot.completedKeys.join(", ") : "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">stepCompletedAt</dt>
          <dd className="max-h-20 overflow-auto break-all text-[11px]">
            {Object.keys(snapshot.stepCompletedAt).length
              ? JSON.stringify(snapshot.stepCompletedAt)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sent invites (gate)</dt>
          <dd>{snapshot.sentInviteCount}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Reset", () => resetGuidedJourney({ clearInvites: true }))}
        >
          Reset journey
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Back", () => adminJourneyGoBackStep())}
        >
          Go back step
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Advance", () => adminJourneyAdvanceExpectableStep())}
        >
          Advance / complete step
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Skip delay", () => adminJourneySkipSoapsDelay())}
        >
          Skip SOAPS delay
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Clear invites", () => adminJourneyClearInvites())}
        >
          Clear invites
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Seed 1", () => adminJourneySeedSentInvites(1))}
        >
          Seed 1 invite
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="border-amber-700/30 bg-white/80 dark:bg-stone-900/80"
          onClick={() => void run("Seed 3", () => adminJourneySeedSentInvites(3))}
        >
          Seed 3 invites
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Jump to step (not completed)</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={jumpKey}
            onChange={(e) => setJumpKey(e.target.value)}
            disabled={busy}
          >
            {LINEAR_DISCIPLESHIP_STEP_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void run("Jump", () => setJourneyStep(jumpKey))}
        >
          Set step
        </Button>
      </div>
    </div>
  );
}
