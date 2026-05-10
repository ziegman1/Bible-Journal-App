"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  ScrollText,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AppBrandLink } from "@/components/app-brand-link";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { GuestModeBanner } from "@/components/guest/guest-mode-banner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clearGuestBrowserSession } from "@/lib/guest/guest-mode.client";
import { APP_NAME } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Nav = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const GUEST_NAV: Nav[] = [
  { href: "/app", label: "Home", icon: Home, match: (p) => p === "/app" },
  { href: "/app/read", label: "Read", icon: BookOpen, match: (p) => p.startsWith("/app/read") },
  { href: "/app/soaps", label: "SOAPS", icon: BookMarked, match: (p) => p.startsWith("/app/soaps") || p.startsWith("/app/journal") },
  { href: "/app/prayer", label: "Prayer", icon: Heart, match: (p) => p.startsWith("/app/prayer") },
  {
    href: "/app/scripture-memory",
    label: "Scripture Memory",
    icon: ScrollText,
    match: (p) => p.startsWith("/app/scripture-memory"),
  },
  { href: "/app/share", label: "Share", icon: Share2, match: (p) => p.startsWith("/app/share") },
  {
    href: "/app/groups/personal-thirds",
    label: "Personal 3/3rds",
    icon: Users,
    match: (p) => p.startsWith("/app/groups/personal-thirds"),
  },
  { href: "/app/chat", label: "CHAT", icon: MessageCircle, match: (p) => p.startsWith("/app/chat") && !p.startsWith("/app/chat/groups") },
];

function linkClass(active: boolean) {
  return cn(
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors touch-manipulation",
    active
      ? "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
  );
}

export function GuestAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function exitGuest() {
    clearGuestBrowserSession();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GuestModeBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
          <div className="border-b border-border p-4">
            <AppBrandLink />
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {GUEST_NAV.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link key={item.href} href={item.href} className={linkClass(active)}>
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-2">
            <Link
              href="/signup?fromGuest=1"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full touch-manipulation")}
            >
              Sign up
            </Link>
            <Button type="button" variant="ghost" size="sm" className="mt-1 w-full touch-manipulation" onClick={exitGuest}>
              <LogOut className="mr-2 size-4" aria-hidden />
              Exit guest
            </Button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3 px-4">
              <div className="flex items-center gap-2">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg md:hidden touch-manipulation">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="border-b border-border p-4">
                      <SheetTitle className="text-left">
                        <AppBrandLink onNavigate={() => setOpen(false)} />
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="space-y-0.5 p-2">
                      {GUEST_NAV.map((item) => {
                        const Icon = item.icon;
                        const active = item.match(pathname);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={linkClass(active)}
                            onClick={() => setOpen(false)}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </SheetContent>
                </Sheet>
                <BadwrLogo variant="micro" className="md:hidden" />
                <span className="text-sm text-muted-foreground">Guest · {APP_NAME}</span>
              </div>
              <Button type="button" variant="ghost" size="sm" className="touch-manipulation" onClick={exitGuest}>
                Exit
              </Button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
          <div className="shrink-0 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <SiteFooter variant="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
