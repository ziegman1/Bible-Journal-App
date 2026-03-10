import { NextResponse } from "next/server";

/** Lightweight check that Supabase URL is reachable. Does not expose credentials. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL is not set in .env.local" },
      { status: 400 }
    );
  }

  const baseUrl = url.replace(/\/$/, "");

  // Reject obvious placeholders
  if (
    baseUrl.includes("your-project") ||
    baseUrl.includes("your-project.supabase.co") ||
    baseUrl === "https://.supabase.co" ||
    !baseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid Supabase URL",
        detail: `URL must be https://YOUR_PROJECT_REF.supabase.co (get it from Supabase Dashboard → Project Settings → API)`,
        hint: "Replace the placeholder in .env.local with your actual project URL.",
      },
      { status: 400 }
    );
  }

  if (!anonKey || anonKey === "your-anon-key") {
    return NextResponse.json(
      {
        ok: false,
        error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder",
        hint: "Get your anon key from Supabase Dashboard → Project Settings → API.",
      },
      { status: 400 }
    );
  }

  const healthUrl = `${baseUrl}/auth/v1/health`;

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      return NextResponse.json({
        ok: true,
        message: "Supabase is reachable",
      });
    }
    return NextResponse.json({
      ok: false,
      error: "Supabase responded with an error",
      detail: `Status ${res.status}`,
      hint: "Check that your anon key is correct. If the project was paused, resume it in the Supabase Dashboard.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isFetchFailed =
      message.toLowerCase().includes("fetch") ||
      message.toLowerCase().includes("econnrefused") ||
      message.toLowerCase().includes("enotfound") ||
      message.toLowerCase().includes("network");

    return NextResponse.json(
      {
        ok: false,
        error: "Cannot reach Supabase",
        detail: message,
        hint: isFetchFailed
          ? "1) Resume paused project at supabase.com/dashboard 2) Verify NEXT_PUBLIC_SUPABASE_URL in .env.local 3) Restart dev server after changing .env.local"
          : "Check your network and Supabase project status.",
      },
      { status: 503 }
    );
  }
}
