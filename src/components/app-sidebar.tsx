"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BookMarked,
  Tags,
  Calendar,
  Settings,
  Menu,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/read", label: "Read", icon: BookOpen },
  { href: "/app/journal", label: "Journal", icon: BookMarked },
  { href: "/app/themes", label: "Themes", icon: Tags },
  { href: "/app/annual-journal", label: "Annual Journey", icon: Calendar },
  { href: "/app/threads", label: "Study Threads", icon: MessageSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
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

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: hamburger + sheet (trigger rendered by AppHeader via slot) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
            <SheetTitle>
              <Link href="/app" onClick={() => setOpen(false)} className="font-serif text-lg font-light">
                Bible Journal
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop: sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 min-h-screen flex-col">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <Link href="/app" className="font-serif text-lg font-light text-stone-800 dark:text-stone-200">
            Bible Journal
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
