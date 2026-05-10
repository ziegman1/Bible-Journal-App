import { authLog } from "@/lib/auth-debug";
import { navDiagServerAppLayoutReset, navDiagServerAppLayoutStep } from "@/lib/debug/nav-diag";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { AuthHydrationBoundary } from "@/components/auth/auth-hydration-boundary";
import { SiteFooter } from "@/components/site-footer";
import { resolveCustomDashboardItemIds } from "@/lib/app-experience-mode/dashboard-items";
import {
  customDashboardNavHrefsFromItemIds,
  resolveCustomDashboardSidebarItemIds,
} from "@/lib/app-experience-mode/custom-sidebar-nav";
import { journeyFilteredNavHrefList } from "@/lib/app-experience-mode/journey-nav";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import type { AppExperienceMode } from "@/lib/app-experience-mode/types";
import { resolveCachedAppLayoutAuth } from "@/lib/supabase/cached-app-auth.server";
import { BADWR_ADMIN_GUEST_PREVIEW_HEADER } from "@/lib/admin/admin-test-headers";
import { GUEST_REQUEST_HEADER } from "@/lib/guest/guest-paths";
import { GuestAppShell } from "@/components/guest/guest-app-shell";
import { GuestModeProvider } from "@/components/guest/guest-mode-context";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  navDiagServerAppLayoutReset();
  navDiagServerAppLayoutStep("app_layout_start");

  const headersList = await headers();
  navDiagServerAppLayoutStep("app_layout_after_headers");
  const isInviteRoute = headersList.get("x-invite-route") === "1";
  const isFacilitatorPresent =
    headersList.get("x-facilitator-present") === "1";
  const isGuestBrowser = headersList.get(GUEST_REQUEST_HEADER) === "1";
  const adminGuestPreviewShell = headersList.get(BADWR_ADMIN_GUEST_PREVIEW_HEADER) === "1";

  if (isGuestBrowser) {
    return (
      <GuestModeProvider>
        <GuestAppShell adminGuestPreview={adminGuestPreviewShell}>
          <AuthHydrationBoundary allowAnonymous>{children}</AuthHydrationBoundary>
        </GuestAppShell>
      </GuestModeProvider>
    );
  }

  // Invite: skip Supabase in this layout — middleware allows unauthenticated access.
  if (isInviteRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1">{children}</div>
        <div className="shrink-0 border-t border-border px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SiteFooter variant="compact" />
        </div>
      </div>
    );
  }

  const { supabase, user, profile } = await resolveCachedAppLayoutAuth();
  navDiagServerAppLayoutStep("app_layout_after_resolveCachedAuth");
  if (!supabase) {
    redirect("/setup");
  }
  navDiagServerAppLayoutStep("app_layout_after_getUser", { hasUser: !!user });

  if (!user) {
    authLog("redirect_to_login", { reason: "app_layout_no_user" });
    redirect("/login");
  }

  navDiagServerAppLayoutStep("app_layout_after_profile_select", { hasProfile: !!profile });

  const needsOnboarding = !profile?.onboarding_complete;

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  if (isFacilitatorPresent) {
    return (
      <AuthHydrationBoundary>{children}</AuthHydrationBoundary>
    );
  }

  const experienceMode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (!experienceMode) {
    redirect("/start-here");
  }

  const { hrefs: customSidebarNavHrefs, kind: sidebarFilterKind } = buildSidebarNavState(
    experienceMode,
    profile?.custom_dashboard_items,
    profile?.custom_dashboard_modules,
    profile?.journey_progress
  );
  navDiagServerAppLayoutStep("app_layout_ready_shell", { experienceMode: experienceMode ?? "" });

  const isAdminTester = isBadwrAdminTestUser(user);

  return (
    <AppShell
      displayName={profile?.display_name ?? undefined}
      customSidebarNavHrefs={customSidebarNavHrefs}
      sidebarFilterKind={sidebarFilterKind}
      isAdminTester={isAdminTester}
    >
      <AuthHydrationBoundary>{children}</AuthHydrationBoundary>
    </AppShell>
  );
}

function buildSidebarNavState(
  mode: AppExperienceMode,
  rawItems: unknown,
  rawModules: unknown,
  journeyProgress: unknown
): {
  hrefs: readonly string[] | null;
  kind: "custom" | "journey" | null;
} {
  if (mode === "journey") {
    return { hrefs: journeyFilteredNavHrefList(journeyProgress), kind: "journey" };
  }
  if (mode === "custom") {
    const rawIds = resolveCustomDashboardItemIds("custom", rawItems, rawModules);
    const itemIds = resolveCustomDashboardSidebarItemIds(rawIds);
    return { hrefs: Array.from(customDashboardNavHrefsFromItemIds(itemIds)), kind: "custom" };
  }
  return { hrefs: null, kind: null };
}
