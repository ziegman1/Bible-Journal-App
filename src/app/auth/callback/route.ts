import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/app";

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/setup`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
    const msg =
      error.message?.toLowerCase().includes("expired") ||
      error.message?.toLowerCase().includes("invalid")
        ? "Email link is invalid or expired"
        : error.message;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Email link is invalid or expired")}`
  );
}
