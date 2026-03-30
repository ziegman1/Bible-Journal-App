import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";
import { resolvePostAuthDestination } from "@/lib/site-config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectToParam = searchParams.get("redirectTo");
  const nextParam = searchParams.get("next");
  const destination = resolvePostAuthDestination(redirectToParam, nextParam);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Email link may wrongly point at localhost; still redirect session to the real deployed site
  let isLocalOrigin = false;
  try {
    const host = new URL(origin).hostname;
    isLocalOrigin = host === "localhost" || host === "127.0.0.1";
  } catch {
    /* keep false */
  }
  const baseUrl = isLocalOrigin ? getPublicSiteBaseUrl() : origin.replace(/\/$/, "");

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
      const redirect = NextResponse.redirect(`${baseUrl}${destination}`);
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
