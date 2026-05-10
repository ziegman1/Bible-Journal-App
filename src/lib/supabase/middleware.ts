import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authLog } from "@/lib/auth-debug";
import { navDiagServer } from "@/lib/debug/nav-diag";
import { isLinearDiscipleshipPathGraduated } from "@/lib/app-experience-mode/linear-discipleship-path";
import { parseJourneyProgress } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";
import { BADWR_ADMIN_GUEST_PREVIEW_HEADER } from "@/lib/admin/admin-test-headers";
import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_VALUE,
  GUEST_REQUEST_HEADER,
  isGuestAllowedAppPath,
} from "@/lib/guest/guest-paths";

export async function updateSession(request: NextRequest) {
  const mwT0 = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const path = request.nextUrl.pathname;
    if (
      path.startsWith("/app") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/scripture") ||
      path.startsWith("/start-here")
    ) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAppRoute = path.startsWith("/app");
  const isOnboarding = path.startsWith("/onboarding");
  const isScriptureRoute = path.startsWith("/scripture");
  const isStartHereRoute = path.startsWith("/start-here");
  // Optional trailing slash so layout still gets x-invite-route after redirects / copy-paste
  const isInviteAcceptRoute = /^\/app\/groups\/invite\/[^/]+\/?$/.test(
    request.nextUrl.pathname
  );

  // Allow unauthenticated access to invite page; set header so app layout can skip auth
  if (isInviteAcceptRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-invite-route", "1");
    const inviteResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) =>
      inviteResponse.cookies.set(c.name, c.value, { path: "/" })
    );
    supabaseResponse = inviteResponse;
  }

  const isFacilitatorPresentRoute =
    /^\/app\/groups\/[^/]+\/meetings\/[^/]+\/present(?:\/|$)/.test(
      request.nextUrl.pathname
    );

  if (isFacilitatorPresentRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-facilitator-present", "1");
    const presentResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) =>
      presentResponse.cookies.set(c.name, c.value, { path: "/" })
    );
    supabaseResponse = presentResponse;
  }

  const guestPreviewQuery = request.nextUrl.searchParams.get("guestPreview") === "1";
  if (
    user &&
    isAppRoute &&
    !isInviteAcceptRoute &&
    !isFacilitatorPresentRoute &&
    guestPreviewQuery &&
    isGuestAllowedAppPath(path) &&
    isBadwrAdminTestUser(user)
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(GUEST_REQUEST_HEADER, "1");
    requestHeaders.set(BADWR_ADMIN_GUEST_PREVIEW_HEADER, "1");
    const previewResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) =>
      previewResponse.cookies.set(c.name, c.value, { path: "/" })
    );
    return previewResponse;
  }

  const isAuthRoute =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path === "/";

  const redirectWithCookies = (url: URL) => {
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) =>
      res.cookies.set(c.name, c.value, { path: "/" })
    );
    return res;
  };

  const normalizedPath = path.replace(/\/$/, "") || "/";
  if (user && normalizedPath === "/app") {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("app_experience_mode, journey_progress")
        .eq("id", user.id)
        .maybeSingle();
      const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
      if (mode === "journey" && profile?.journey_progress != null && user && canAccessGuidedJourney(user)) {
        const jp = parseJourneyProgress(profile.journey_progress);
        const linear = jp.linearDiscipleshipPath;
        if (linear && !isLinearDiscipleshipPathGraduated(linear)) {
          const url = request.nextUrl.clone();
          url.pathname = "/app/journey";
          url.search = "";
          return redirectWithCookies(url);
        }
      }
    } catch {
      /* profile read failed — allow /app to render and let the page redirect */
    }
  }

  if (user && isAuthRoute && !isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return redirectWithCookies(url);
  }

  const guestBrowserCookie =
    request.cookies.get(GUEST_COOKIE_NAME)?.value === GUEST_COOKIE_VALUE;

  if (
    !user &&
    isAppRoute &&
    !isInviteAcceptRoute &&
    guestBrowserCookie &&
    isGuestAllowedAppPath(path)
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(GUEST_REQUEST_HEADER, "1");
    const guestResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) =>
      guestResponse.cookies.set(c.name, c.value, { path: "/" })
    );
    supabaseResponse = guestResponse;
    return supabaseResponse;
  }

  if (!user && isAppRoute && !isInviteAcceptRoute && guestBrowserCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return redirectWithCookies(url);
  }

  if (
    !user &&
    (isAppRoute || isOnboarding || isScriptureRoute || isStartHereRoute) &&
    !isInviteAcceptRoute
  ) {
    const cookieNames = request.cookies.getAll().map((c) => c.name);
    const supabaseAuthCookieHint = cookieNames.some((n) =>
      n.includes("sb-") && n.includes("-auth-")
    );
    authLog("redirect_to_login", {
      reason: "middleware_no_user",
      path,
      supabaseAuthCookieHint,
      cookieNameCount: cookieNames.length,
    });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const back =
      request.nextUrl.pathname +
      (request.nextUrl.search ? request.nextUrl.search : "");
    url.searchParams.set("redirectTo", back);
    return redirectWithCookies(url);
  }

  const mwMs = Date.now() - mwT0;
  if (process.env.BADWR_NAV_DIAG === "1" && mwMs > 400) {
    navDiagServer("middleware_slow", { path, ms: mwMs });
  }

  return supabaseResponse;
}
