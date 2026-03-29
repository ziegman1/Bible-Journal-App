"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import {
  Home,
  BookOpen,
  Settings,
  Menu,
  LogOut,
  Users,
  MessageCircle,
  Waypoints,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppBrandLink } from "@/components/app-brand-link";
import { SoapsHubSidebarNav } from "@/components/soaps-hub-sidebar-nav";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/read", label: "Read", icon: BookOpen },
  { href: "/app/groups", label: "3/3rds Groups", icon: Users },
  { href: "/app/chat", label: "CHAT", icon: MessageCircle },
  { href: "/app/list-of-100", label: "List of 100", icon: ClipboardList },
  { href: "/app/process-map", label: "Discipleship Process", icon: Waypoints },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/process-map") {
    return (
      pathname.startsWith("/app/process-map") ||
      pathname.startsWith("/app/pathway") ||
      pathname.startsWith("/app/discipleship-process")
    );
  }
  return pathname.startsWith(href);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <SoapsHubSidebarNav pathname={pathname} onNavigate={onNavigate} />
      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

interface AppShellProps {
  displayName?: string;
  children: React.ReactNode;
}

export function AppShell({ displayName, children }: AppShellProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "hidden w-56 shrink-0 flex-col border-r border-stone-200 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-900/50",
          "md:flex md:sticky md:top-0 md:h-dvh md:max-h-dvh md:self-start md:overflow-y-auto",
        )}
      >
        <div className="shrink-0 p-6 border-b border-stone-200 dark:border-stone-800">
          <AppBrandLink />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 bg-background/95 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="shrink-0 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 sm:w-72">
                <SheetHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <SheetTitle className="text-left">
                    <AppBrandLink onNavigate={() => setSheetOpen(false)} />
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-1">
                  <NavLinks pathname={pathname} onNavigate={() => setSheetOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-stone-600 dark:text-stone-400 truncate">
              {displayName ? `Welcome, ${displayName}` : "BADWR"}
            </span>
          </div>
          <form action={signOut} className="shrink-0">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4 md:mr-2" />
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </form>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
