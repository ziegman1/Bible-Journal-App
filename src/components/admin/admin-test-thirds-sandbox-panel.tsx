"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  applyAdminSandboxThirdsScenario,
  ensureAdminSandboxThirdsGroup,
  resetAdminSandboxThirdsGroup,
  setAdminSandboxStarterTrackMode,
} from "@/app/actions/admin-sandbox-third-group";
import {
  ADMIN_SANDBOX_SCENARIO_LABELS,
  type AdminSandboxThirdsScenario,
} from "@/lib/admin/admin-sandbox-third-constants";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SCENARIOS = Object.keys(ADMIN_SANDBOX_SCENARIO_LABELS) as AdminSandboxThirdsScenario[];

export function AdminTestThirdsSandboxPanel({ initialGroupId }: { initialGroupId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groupId, setGroupId] = useState<string | null>(initialGroupId);

  useEffect(() => {
    setGroupId(initialGroupId);
  }, [initialGroupId]);

  const run = (fn: () => Promise<void>) => {
    startTransition(() => {
      void (async () => {
        await fn();
        router.refresh();
      })();
    });
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4 border-b border-border px-6 pb-8 pt-2">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
          Test 3/3rds Group
        </p>
        <h2 className="text-lg font-medium text-foreground">Isolated sandbox (seeded rows)</h2>
        <p className="text-sm text-muted-foreground">
          Opens a real group workspace tagged as test data. Only allowlisted admin accounts can use this. Invites do not
          send email; completing meetings does not count toward your pillar streak. Use{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">sandboxRole=participant</code> on the URL (or the
          in-group banner) to preview participant UI without signing out.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = await ensureAdminSandboxThirdsGroup();
              if ("error" in r && r.error) {
                toast.error(r.error);
                return;
              }
              if ("groupId" in r) {
                setGroupId(r.groupId);
                router.push(`/app/groups/${r.groupId}?testMode=1&sandboxRole=facilitator`);
              }
            })
          }
        >
          Open test group
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = await resetAdminSandboxThirdsGroup();
              if ("error" in r && r.error) {
                toast.error(r.error);
                return;
              }
              if ("groupId" in r) {
                setGroupId(r.groupId);
                toast.success("Sandbox reset to baseline.");
                router.push(`/app/groups/${r.groupId}?testMode=1&sandboxRole=facilitator`);
              }
            })
          }
        >
          Reset test group
        </Button>
      </div>

      {groupId ? (
        <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick state</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await setAdminSandboxStarterTrackMode(groupId, "starter");
                  if ("error" in r && r.error) toast.error(r.error);
                  else toast.success("Starter Track ON (vision pre-filled for Week 1).");
                })
              }
            >
              Starter Track ON
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await setAdminSandboxStarterTrackMode(groupId, "experienced");
                  if ("error" in r && r.error) toast.error(r.error);
                  else toast.success("Starter Track OFF (experienced path).");
                })
              }
            >
              Starter Track OFF
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Meeting scenarios (clears sandbox meetings &amp; invites)</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {SCENARIOS.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  className="justify-start text-left h-auto min-h-9 py-2 whitespace-normal"
                  onClick={() =>
                    run(async () => {
                      const r = await applyAdminSandboxThirdsScenario(groupId, s);
                      if ("error" in r && r.error) toast.error(r.error);
                      else toast.success(ADMIN_SANDBOX_SCENARIO_LABELS[s]);
                    })
                  }
                >
                  {ADMIN_SANDBOX_SCENARIO_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground">Personal 3/3rds (UI-only DBS / devotional)</p>
            <Link
              href="/app/soaps?testMode=1&mode=dbs"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open SOAPS with DBS preview
            </Link>{" "}
            <Link
              href="/app/soaps?testMode=1&mode=devotional"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open SOAPS with devotional preview
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No sandbox yet — use Open test group to create one.</p>
      )}
    </section>
  );
}
