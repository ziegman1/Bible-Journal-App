"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Settings,
  MessageCircle,
  Users,
  Waypoints,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppBrandLink } from "@/components/app-brand-link";
import { SoapsHubSidebarNav } from "@/components/soaps-hub-sidebar-nav";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/read", label: "Read", icon: BookOpen },
  { href: "/app/process-map", label: "Discipleship Process", icon: Waypoints },
  { href: "/app/groups", label: "3/3rds Groups", icon: Users },
  { href: "/app/chat", label: "CHAT", icon: MessageCircle },
  { href: "/app/list-of-100", label: "List of 100", icon: ClipboardList },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/process-map") {
    return pathname.startsWith("/app/process-map") || pathname.startsWith("/app/pathway");
  }
  return pathname.startsWith(href);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
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

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
            <SheetTitle className="text-left">
              <AppBrandLink onNavigate={() => setOpen(false)} />
            </SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex w-56 shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 min-h-screen flex-col">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <AppBrandLink />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
