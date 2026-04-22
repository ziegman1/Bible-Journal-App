"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@base-ui/react/tooltip";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import {
  Home,
  BookOpen,
  BookMarked,
  Heart,
  Settings,
  Menu,
  LogOut,
  Users,
  MessageCircle,
  Waypoints,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  ScrollText,
  Share2,
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
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { APP_NAME } from "@/lib/site-config";

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

function isSoapsHubActive(pathname: string): boolean {
  return (
    pathname === "/app/soaps" ||
    pathname.startsWith("/app/journal") ||
    pathname.startsWith("/app/themes") ||
    pathname.startsWith("/app/insights") ||
    pathname.startsWith("/app/threads") ||
    pathname.startsWith("/app/thread/")
  );
}

function isPrayerHubActive(pathname: string): boolean {
  return pathname.startsWith("/app/prayer");
}

function isDashboardSetupActive(pathname: string): boolean {
  return pathname.startsWith("/app/dashboard-setup");
}

type ToolNavRow = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

/** Stable order for custom-mode sidebar (subset by selected dashboard tools). */
const ORDERED_TOOL_NAV: ToolNavRow[] = [
  { href: "/app/read", label: "Read", icon: BookOpen, isActive: (p) => p.startsWith("/app/read") },
  { href: "/app/soaps", label: "SOAPS", icon: BookMarked, isActive: isSoapsHubActive },
  { href: "/app/prayer", label: "Prayer", icon: Heart, isActive: isPrayerHubActive },
  {
    href: "/app/scripture-memory",
    label: "Scripture Memory",
    icon: ScrollText,
    isActive: (p) => p.startsWith("/app/scripture-memory"),
  },
  { href: "/app/share", label: "Share", icon: Share2, isActive: (p) => p.startsWith("/app/share") },
  { href: "/app/groups", label: "3/3rds Groups", icon: Users, isActive: (p) => p.startsWith("/app/groups") },
  { href: "/app/chat", label: "CHAT", icon: MessageCircle, isActive: (p) => p.startsWith("/app/chat") },
  {
    href: "/app/list-of-100",
    label: "List of 100",
    icon: ClipboardList,
    isActive: (p) => p.startsWith("/app/list-of-100"),
  },
  {
    href: "/app/process-map",
    label: "Discipleship Process",
    icon: Waypoints,
    isActive: (p) => isItemActive(p, "/app/process-map"),
  },
];

const SIDEBAR_EXPANDED_KEY = "badwr-app-sidebar-expanded";
const HOVER_LEAVE_MS = 240;

function navLinkClass(isActive: boolean, iconOnly: boolean) {
  return cn(
    "flex items-center rounded-lg text-sm transition-colors touch-manipulation min-h-[44px] sm:min-h-0 sm:py-2",
    iconOnly ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
    isActive
      ? "bg-stone-200 text-stone-900 ring-1 ring-inset ring-stone-400/50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-500/45"
      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-100"
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  showLabels,
  withTooltips,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  showLabels: boolean;
  withTooltips: boolean;
  onNavigate?: () => void;
}) {
  const iconOnly = !showLabels;
  const className = navLinkClass(isActive, iconOnly);
  const body = (
    <>
      <Icon className="size-4 shrink-0" />
      {showLabels ? <span>{label}</span> : null}
    </>
  );

  if (!withTooltips) {
    return (
      <Link href={href} onClick={onNavigate} aria-label={label} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={320}
        render={(triggerProps: ComponentPropsWithoutRef<"a">) => (
          <Link
            {...triggerProps}
            href={href}
            onClick={onNavigate}
            aria-label={label}
            className={cn(className, triggerProps.className)}
          >
            {body}
          </Link>
        )}
      />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={10} align="center" className="z-[80]">
          <Tooltip.Popup className="rounded-md border border-stone-200 bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-50 shadow-md dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function NavLinks({
  pathname,
  onNavigate,
  variant = "full",
  withTooltips = false,
  customSidebarNavHrefs = null,
}: {
  pathname: string;
  onNavigate?: () => void;
  variant?: "full" | "icons";
  /** Desktop icon rail: show Base UI tooltips on hover (no native `title`). */
  withTooltips?: boolean;
  /** When set (Custom dashboard mode), only these tool routes appear between Home and Settings. */
  customSidebarNavHrefs?: readonly string[] | null;
}) {
  const showLabels = variant === "full";
  const filter = customSidebarNavHrefs != null ? new Set(customSidebarNavHrefs) : null;

  if (filter) {
    return (
      <>
        <SidebarNavItem
          href="/app"
          label="Home"
          icon={Home}
          isActive={pathname === "/app"}
          showLabels={showLabels}
          withTooltips={withTooltips}
          onNavigate={onNavigate}
        />
        {ORDERED_TOOL_NAV.filter((row) => filter.has(row.href)).map((row) => (
          <SidebarNavItem
            key={row.href}
            href={row.href}
            label={row.label}
            icon={row.icon}
            isActive={row.isActive(pathname)}
            showLabels={showLabels}
            withTooltips={withTooltips}
            onNavigate={onNavigate}
          />
        ))}
        <SidebarNavItem
          href="/app/dashboard-setup"
          label="Customize dashboard"
          icon={LayoutGrid}
          isActive={isDashboardSetupActive(pathname)}
          showLabels={showLabels}
          withTooltips={withTooltips}
          onNavigate={onNavigate}
        />
        <SidebarNavItem
          href="/app/settings"
          label="Settings"
          icon={Settings}
          isActive={isItemActive(pathname, "/app/settings")}
          showLabels={showLabels}
          withTooltips={withTooltips}
          onNavigate={onNavigate}
        />
      </>
    );
  }

  return (
    <>
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(pathname, item.href);
        return (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={Icon}
            isActive={isActive}
            showLabels={showLabels}
            withTooltips={withTooltips}
            onNavigate={onNavigate}
          />
        );
      })}
      <SidebarNavItem
        href="/app/soaps"
        label="SOAPS"
        icon={BookMarked}
        isActive={isSoapsHubActive(pathname)}
        showLabels={showLabels}
        withTooltips={withTooltips}
        onNavigate={onNavigate}
      />
      <SidebarNavItem
        href="/app/prayer"
        label="Prayer"
        icon={Heart}
        isActive={isPrayerHubActive(pathname)}
        showLabels={showLabels}
        withTooltips={withTooltips}
        onNavigate={onNavigate}
      />
      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(pathname, item.href);
        return (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={Icon}
            isActive={isActive}
            showLabels={showLabels}
            withTooltips={withTooltips}
            onNavigate={onNavigate}
          />
        );
      })}
    </>
  );
}

interface AppShellProps {
  displayName?: string;
  children: React.ReactNode;
  /** Custom dashboard mode: visible primary tool hrefs (Home / Settings / customize added in nav). */
  customSidebarNavHrefs?: readonly string[] | null;
}

export function AppShell({ displayName, children, customSidebarNavHrefs = null }: AppShellProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [allowHoverExpand, setAllowHoverExpand] = useState(false);
  const sidebarHydrated = useRef(false);
  const hoverLeaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setAllowHoverExpand(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_EXPANDED_KEY) === "1") {
        setPinnedExpanded(true);
      }
    } catch {
      /* ignore */
    }
    sidebarHydrated.current = true;
  }, []);

  useEffect(() => {
    if (pinnedExpanded) setHoverExpanded(false);
  }, [pinnedExpanded]);

  useEffect(
    () => () => {
      if (hoverLeaveTimerRef.current != null) {
        window.clearTimeout(hoverLeaveTimerRef.current);
      }
    },
    []
  );

  function clearHoverLeaveTimer() {
    if (hoverLeaveTimerRef.current != null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  }

  function onAsidePointerEnter() {
    clearHoverLeaveTimer();
    if (!pinnedExpanded && allowHoverExpand) {
      setHoverExpanded(true);
    }
  }

  function onAsidePointerLeave() {
    if (pinnedExpanded) return;
    clearHoverLeaveTimer();
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      setHoverExpanded(false);
      hoverLeaveTimerRef.current = null;
    }, HOVER_LEAVE_MS);
  }

  function togglePinnedSidebar() {
    setPinnedExpanded((v) => {
      const next = !v;
      if (sidebarHydrated.current) {
        try {
          window.localStorage.setItem(SIDEBAR_EXPANDED_KEY, next ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }

  const showLabels = pinnedExpanded || hoverExpanded;
  const desktopTooltips = !showLabels;

  return (
    <Tooltip.Provider delay={320} timeout={400}>
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-stone-200 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-900/50",
            "md:flex md:sticky md:top-0 md:h-dvh md:max-h-dvh md:self-start md:overflow-y-auto md:overflow-x-hidden",
            "transition-[width] duration-200 ease-out motion-reduce:transition-none",
            showLabels ? "md:w-56" : "md:w-[4.25rem]"
          )}
          onPointerEnter={onAsidePointerEnter}
          onPointerLeave={onAsidePointerLeave}
        >
          <div
            className={cn(
              "shrink-0 border-b border-stone-200 dark:border-stone-800 pt-[calc(1.5rem+env(safe-area-inset-top))]",
              showLabels ? "px-6 pb-6" : "flex justify-center px-2 pb-4"
            )}
          >
            <AppBrandLink className={cn(!showLabels && "scale-95")} />
          </div>
          <nav className={cn("flex flex-1 flex-col space-y-1", showLabels ? "p-4" : "p-2")}>
            <div id="app-desktop-nav" className="flex-1 space-y-1">
              <NavLinks
                pathname={pathname}
                variant={showLabels ? "full" : "icons"}
                withTooltips={desktopTooltips}
                customSidebarNavHrefs={customSidebarNavHrefs}
              />
            </div>
            <button
              type="button"
              onClick={togglePinnedSidebar}
              className={cn(
                "mt-2 flex min-h-10 w-full items-center justify-center rounded-lg text-stone-500 transition-colors",
                "hover:bg-stone-200/80 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-expanded={pinnedExpanded}
              aria-controls="app-desktop-nav"
              title={pinnedExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {pinnedExpanded ? (
                <ChevronsLeft className="size-4 shrink-0" aria-hidden />
              ) : (
                <ChevronsRight className="size-4 shrink-0" aria-hidden />
              )}
              <span className="sr-only">{pinnedExpanded ? "Collapse sidebar" : "Expand sidebar"}</span>
            </button>
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 shrink-0 border-b border-stone-200 dark:border-stone-800 bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
            <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden touch-manipulation">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0 sm:w-72">
                    <SheetHeader className="border-b border-stone-200 p-4 dark:border-stone-800">
                      <SheetTitle className="text-left">
                        <AppBrandLink onNavigate={() => setSheetOpen(false)} />
                      </SheetTitle>
                    </SheetHeader>
                    <nav id="app-mobile-nav" className="space-y-1 p-4">
                      <NavLinks
                        pathname={pathname}
                        onNavigate={() => setSheetOpen(false)}
                        variant="full"
                        withTooltips={false}
                        customSidebarNavHrefs={customSidebarNavHrefs}
                      />
                    </nav>
                  </SheetContent>
                </Sheet>
                <div className="flex min-w-0 items-center gap-2">
                  <BadwrLogo variant="micro" className="md:hidden" />
                  {displayName ? (
                    <span className="truncate text-sm text-stone-600 dark:text-stone-400">
                      Welcome, {displayName}
                    </span>
                  ) : (
                    <span className="sr-only">{APP_NAME}</span>
                  )}
                </div>
              </div>
              <form action={signOut} className="shrink-0">
                <Button
                  type="submit"
                  variant="ghost"
                  size="default"
                  className="min-h-10 gap-2 px-3 text-sm touch-manipulation"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  <span>Sign out</span>
                </Button>
              </form>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
          <div className="shrink-0 border-t border-stone-200 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-stone-800">
            <SiteFooter variant="compact" />
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
