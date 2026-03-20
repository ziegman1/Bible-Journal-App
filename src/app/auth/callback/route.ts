import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectToParam = searchParams.get("redirectTo");
  const redirectTo =
    redirectToParam && (redirectToParam.startsWith("/app") || redirectToParam === "/onboarding")
      ? redirectToParam
      : "/app";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Use production URL if callback landed on localhost (wrong link in email)
  const baseUrl =
    origin.includes("localhost") && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : origin;

  const cookieStore = await cookies();

  // Create a response we control so session cookies are set on it, then copy to redirect
  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirect = NextResponse.redirect(`${baseUrl}${redirectTo}`);
      response.cookies.getAll().forEach((c) =>
        redirect.cookies.set(c.name, c.value, { path: "/" })
      );
      return redirect;
    }
    const msg =
      error.message?.toLowerCase().includes("expired") ||
      error.message?.toLowerCase().includes("invalid")
        ? "Email link is invalid or expired"
        : error.message;
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(msg)}`
    );
  }

  return NextResponse.redirect(
    `${baseUrl}/login?error=${encodeURIComponent("Email link is invalid or expired")}`
  );
}
