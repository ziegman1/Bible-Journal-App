"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ADMIN_SANDBOX_MOCK_MEMBERS,
  type AdminSandboxRolePreview,
} from "@/lib/admin/admin-sandbox-third-constants";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: { id: AdminSandboxRolePreview; label: string }[] = [
  { id: "facilitator", label: "Facilitator preview" },
  { id: "participant", label: "Participant preview" },
  { id: "presenter", label: "Presenter (open TV view)" },
];

export function AdminSandboxGroupBanner({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onPresentRoute = pathname.includes("/meetings/") && pathname.endsWith("/present");
  const raw = searchParams.get("sandboxRole")?.trim().toLowerCase();
  const current: AdminSandboxRolePreview =
    raw === "participant" || raw === "presenter" || raw === "facilitator" ? raw : "facilitator";

  function hrefForRole(role: AdminSandboxRolePreview) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("sandboxRole", role);
    p.set("testMode", "1");
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="border-b border-amber-400/50 bg-amber-100 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-amber-700/30 bg-amber-200/80 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide dark:border-amber-400/30 dark:bg-amber-900/50">
            Admin test group
          </span>
          <span className="font-medium">Sandbox environment</span>
          <span className="text-xs text-amber-900/80 dark:text-amber-100/80">
            No real user data affected · invites & streaks are gated
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((opt) => {
            const selected = current === opt.id;
            if (opt.id === "presenter") {
              return (
                <Link
                  key={opt.id}
                  href={`/app/groups/${groupId}/meetings`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    onPresentRoute
                      ? "border-amber-800 bg-amber-800 text-amber-50 dark:border-amber-300 dark:bg-amber-200 dark:text-amber-950"
                      : "border-amber-700/40 bg-amber-50/80 hover:bg-amber-200/80 dark:border-amber-500/40 dark:bg-amber-900/40 dark:hover:bg-amber-900/70"
                  )}
                >
                  {opt.label}
                </Link>
              );
            }
            return (
              <Link
                key={opt.id}
                href={hrefForRole(opt.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "border-amber-800 bg-amber-800 text-amber-50 dark:border-amber-300 dark:bg-amber-200 dark:text-amber-950"
                    : "border-amber-700/40 bg-amber-50/80 hover:bg-amber-200/80 dark:border-amber-500/40 dark:bg-amber-900/40 dark:hover:bg-amber-900/70"
                )}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        <details className="rounded-md border border-amber-800/15 bg-amber-50/50 p-2 text-xs dark:border-amber-200/15 dark:bg-amber-950/40">
          <summary className="cursor-pointer font-medium text-amber-950 dark:text-amber-100">
            Simulated roster (not real members)
          </summary>
          <ul className="mt-2 space-y-1.5 text-amber-900/90 dark:text-amber-100/90">
            {ADMIN_SANDBOX_MOCK_MEMBERS.map((m) => (
              <li key={m.name}>
                <span className="font-medium">{m.name}</span>
                <span className="text-amber-800/80 dark:text-amber-200/80"> — {m.archetype}. </span>
                <span className="text-amber-800/70 dark:text-amber-300/70">{m.note}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
