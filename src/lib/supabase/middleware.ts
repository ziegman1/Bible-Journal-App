import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const path = request.nextUrl.pathname;
    if (
      path.startsWith("/app") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/scripture")
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

  if (user && isAuthRoute && !isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return redirectWithCookies(url);
  }

  if (!user && (isAppRoute || isOnboarding || isScriptureRoute) && !isInviteAcceptRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const back =
      request.nextUrl.pathname +
      (request.nextUrl.search ? request.nextUrl.search : "");
    url.searchParams.set("redirectTo", back);
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}
