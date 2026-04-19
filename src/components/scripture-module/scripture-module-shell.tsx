"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  List,
  PlusCircle,
  Settings,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/scripture", label: "Scripture Home", icon: Home, match: "exact" as const },
  { href: "/scripture/review", label: "Review", icon: BookOpen, match: "prefix" as const },
  { href: "/scripture/new", label: "Add Verse", icon: PlusCircle, match: "prefix" as const },
  { href: "/scripture/lists", label: "Lists", icon: List, match: "prefix" as const },
  { href: "/scripture/settings", label: "Settings", icon: Settings, match: "prefix" as const },
];

function navActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ScriptureModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/scripture"
            className="text-lg font-serif font-light tracking-tight text-foreground"
          >
            Scripture Memory
          </Link>
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Internal preview
          </span>
          <Link
            href="/app"
            className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to app
          </Link>
        </div>
        <nav
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="Scripture module"
        >
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = navActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <div className="shrink-0 border-t border-border px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto max-w-5xl">
          <SiteFooter variant="compact" />
        </div>
      </div>
    </div>
  );
}
