"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminTestQAChecklist } from "@/components/admin/admin-test-qa-checklist";
import { ADMIN_TEST_FIXTURE_NOTE, ADMIN_TEST_STUBS } from "@/lib/admin/test-mode-fixtures";
import {
  ADMIN_TEST_LINK_SECTIONS,
  type AdminTestLinkKind,
  type AdminTestLinkRow,
} from "@/lib/admin/admin-test-mode-link-data";
import { cn } from "@/lib/utils";

type Filter = "all" | AdminTestLinkKind;

const FILTER_LABELS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "safe-preview", label: "Safe Preview" },
  { id: "guest-preview", label: "Guest Preview" },
  { id: "real-data", label: "Real Data" },
];

const KIND_BADGE: Record<
  AdminTestLinkKind,
  { label: string; className: string }
> = {
  "safe-preview": {
    label: "Safe Preview",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
  },
  "guest-preview": {
    label: "Guest Preview",
    className:
      "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/45 dark:text-sky-100",
  },
  "real-data": {
    label: "Real Data",
    className:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  },
};

const KIND_CARD_RING: Record<AdminTestLinkKind, string> = {
  "safe-preview": "ring-2 ring-emerald-400/35 border-emerald-200/90 dark:border-emerald-800/80",
  "guest-preview": "ring-1 ring-sky-400/30 border-sky-200/80 dark:border-sky-800/70",
  "real-data": "border-border/90 ring-0",
};

function KindWarnings({ item }: { item: AdminTestLinkRow }) {
  const lines: string[] = [];
  if (item.kind === "real-data") {
    lines.push("Uses your real account data. Saves will persist.");
  } else if (item.kind === "guest-preview") {
    lines.push("Session-only. No database writes.");
  } else if (item.kind === "safe-preview") {
    if ("href" in item && item.uiOnlyPreference) {
      lines.push("Preview only. No preference changes saved.");
    }
  }
  if (lines.length === 0) return null;
  return (
    <ul className="mt-2 space-y-0.5 border-t border-border/60 pt-2">
      {lines.map((line) => (
        <li key={line} className="text-[0.7rem] leading-snug text-muted-foreground">
          {line}
        </li>
      ))}
    </ul>
  );
}

function LinkCard({ item }: { item: AdminTestLinkRow }) {
  const badge = KIND_BADGE[item.kind];
  const ring = KIND_CARD_RING[item.kind];

  return (
    <li
      className={cn(
        "rounded-lg border bg-card/80 px-3 py-2.5 shadow-sm",
        item.kind === "safe-preview" && "bg-emerald-50/30 dark:bg-emerald-950/15",
        item.kind === "guest-preview" && "bg-sky-50/25 dark:bg-sky-950/12",
        ring
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>
      {"href" in item ? (
        <Link
          href={item.href}
          className="mt-2 block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {item.label}
        </Link>
      ) : (
        <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
      )}
      {"pattern" in item ? (
        <code className="mt-1 block break-all text-xs text-muted-foreground">{item.pattern}</code>
      ) : null}
      {item.hint ? <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p> : null}
      <KindWarnings item={item} />
    </li>
  );
}

function sectionVisibleItems(filter: Filter, items: AdminTestLinkRow[]): AdminTestLinkRow[] {
  if (filter === "all") return items;
  return items.filter((i) => i.kind === filter);
}

export function AdminTestModeLinksDashboard() {
  const [filter, setFilter] = useState<Filter>("all");

  const visibleSections = useMemo(() => {
    return ADMIN_TEST_LINK_SECTIONS.map((sec) => ({
      ...sec,
      items: sectionVisibleItems(filter, sec.items),
    })).filter((s) => s.items.length > 0);
  }, [filter]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-20">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
          Authorized testers only
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">Admin Test Mode</h1>
        <p className="text-sm text-muted-foreground">
          Deep links for QA. Query flags are honored only for allowlisted admin accounts (see{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">BADWR_ADMIN_EMAILS</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">GUIDED_JOURNEY_ADMIN_EMAILS</code>, or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS</code>
          ). Normal users and guests never see this page.
        </p>
      </div>

      <div
        role="status"
        className="rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-50"
      >
        Safe Preview and Guest Preview links are preferred for routine QA. Real Data links use your account — saves
        persist.
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter links</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-emerald-800 dark:text-emerald-200">Safe Preview</span> — UI-only or
          low-write-risk paths.{" "}
          <span className="font-medium text-sky-800 dark:text-sky-200">Guest Preview</span> — session-only guest shell.{" "}
          <span className="font-medium text-amber-900 dark:text-amber-200">Real Data</span> — your account; saves persist.
        </p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Link risk filter">
          {FILTER_LABELS.map(({ id, label }) => {
            const selected = filter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <AdminTestQAChecklist />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Query reference</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <code className="text-foreground">testMode=1</code> or <code className="text-foreground">adminTest=1</code> —
            enables the in-app preview banner (admins only).
          </li>
          <li>
            <code className="text-foreground">guestPreview=1</code> — admin-only: guest shell while signed in
            (guest-allowed routes). No guest cookie.
          </li>
          <li>
            <code className="text-foreground">state=…</code> — reserved for future fixtures (banner only today).
          </li>
          <li>
            <code className="text-foreground">mode=dbs</code> / <code className="text-foreground">mode=devotional</code>{" "}
            — Personal 3/3rds: UI-only Look Up with <code className="text-foreground">testMode=1</code> (Safe Preview).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Seeded / fixture policy</h2>
        <p className="text-sm text-muted-foreground">{ADMIN_TEST_FIXTURE_NOTE}</p>
        <ul className="space-y-2">
          {ADMIN_TEST_STUBS.map((s) => (
            <li key={s.id} className="rounded-md border border-dashed border-border px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="text-muted-foreground"> — {s.description}</span>
            </li>
          ))}
        </ul>
      </section>

      {visibleSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No links match this filter.</p>
      ) : (
        visibleSections.map((section) => (
          <section key={section.id} className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">{section.title}</h2>
            {section.description ? (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            ) : null}
            <ul className="space-y-2.5">
              {section.items.map((item) => (
                <LinkCard key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Real guest mode (cookie)</h2>
        <p className="text-sm text-muted-foreground">
          To test the real guest cookie flow, sign out or use incognito. Admin{" "}
          <code className="rounded bg-muted px-1">guestPreview=1</code> never sets the guest cookie — that is{" "}
          <span className="font-medium text-foreground">Guest Preview</span> in the list above.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        <Link href="/app" className="text-primary underline-offset-4 hover:underline">
          ← Back to app
        </Link>
      </p>
    </div>
  );
}
