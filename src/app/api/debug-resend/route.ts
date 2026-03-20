// TEMP DEBUG: Remove after Resend diagnosis is complete.
// Edit the test recipient below to send a diagnostic email.

import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Edit this to your email for testing:
const TEST_RECIPIENT = "test@example.com";

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? null;

  const safeEnv = {
    hasResendKey: !!resendApiKey,
    resendKeyLength: resendApiKey?.length ?? 0,
    hasFromEmail: !!fromEmail,
    siteUrl,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    timestamp: new Date().toISOString(),
  };

  if (!resendApiKey) {
    return NextResponse.json({
      ok: false,
      source: "debug-resend",
      error: "Missing RESEND_API_KEY",
      ...safeEnv,
    });
  }

  const resend = new Resend(resendApiKey);
  const from = fromEmail || "Bible Journal <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: TEST_RECIPIENT,
      subject: "Resend debug test",
      html: "<p>If you received this, Resend is working.</p>",
    });

    if (error) {
      return NextResponse.json({
        ok: false,
        source: "debug-resend",
        error: error.message,
        resendError: error,
        ...safeEnv,
      });
    }

    return NextResponse.json({
      ok: true,
      source: "debug-resend",
      resendResponse: data,
      ...safeEnv,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      source: "debug-resend",
      error: message,
      ...safeEnv,
    });
  }
}
