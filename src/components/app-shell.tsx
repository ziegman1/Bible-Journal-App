"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import {
  Home,
  BookOpen,
  BookMarked,
  Tags,
  Calendar,
  Settings,
  Menu,
  LogOut,
  MessageSquare,
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

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/read", label: "Read", icon: BookOpen },
  { href: "/app/journal", label: "Journal", icon: BookMarked },
  { href: "/app/themes", label: "Themes", icon: Tags },
  { href: "/app/annual-journal", label: "Annual Journey", icon: Calendar },
  { href: "/app/threads", label: "Study Threads", icon: MessageSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
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
      <aside className="hidden md:flex w-56 shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex-col">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <Link
            href="/app"
            className="font-serif text-lg font-light text-stone-800 dark:text-stone-200"
          >
            Bible Journal
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 bg-background/95 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="md:hidden shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 sm:w-72">
                <SheetHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <SheetTitle>
                    <Link
                      href="/app"
                      onClick={() => setSheetOpen(false)}
                      className="font-serif text-lg font-light"
                    >
                      Bible Journal
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-1">
                  <NavLinks pathname={pathname} onNavigate={() => setSheetOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-stone-600 dark:text-stone-400 truncate">
              {displayName ? `Welcome, ${displayName}` : "Bible Journal"}
            </span>
          </div>
          <form action={signOut} className="shrink-0">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4 md:mr-2" />
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
