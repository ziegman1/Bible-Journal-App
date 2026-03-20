/**
 * TEMP DEBUG: Resend diagnostic endpoint.
 * GET /api/debug-resend?to=your@email.com
 * - Checks env vars (RESEND_API_KEY, RESEND_FROM_EMAIL)
 * - Sends a test email if ?to= is provided
 * TODO: Remove or protect this route before production launch.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_PRODUCTION =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to")?.trim();

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  const payload = {
    ok: true,
    source: "debug-resend" as const,
    error: null as string | null,
    hasResendKey: !!resendApiKey,
    resendKeyLength: resendApiKey?.length ?? 0,
    hasFromEmail: !!fromEmail,
    fromEmail: fromEmail ?? "(will use onboarding@resend.dev)",
    isProduction: IS_PRODUCTION,
    productionWarning:
      IS_PRODUCTION && !fromEmail
        ? "RESEND_FROM_EMAIL not set. onboarding@resend.dev may fail in production. Verify your domain at https://resend.com/domains"
        : null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    timestamp: new Date().toISOString(),
  };

  if (!resendApiKey) {
    payload.ok = false;
    payload.error =
      "Missing RESEND_API_KEY. Add it in Vercel Project Settings → Environment Variables.";
    return NextResponse.json(payload);
  }

  if (!to) {
    return NextResponse.json({
      ...payload,
      message:
        "Add ?to=your@email.com to send a test email and verify Resend is working.",
    });
  }

  const resend = new Resend(resendApiKey);
  const from = fromEmail || "Bible Journal <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Resend debug test — Bible Journal",
      html: "<p>If you received this, Resend is working.</p>",
    });

    if (error) {
      payload.ok = false;
      payload.error = error.message;
      return NextResponse.json({ ...payload, resendError: error });
    }

    payload.ok = true;
    payload.error = null;
    return NextResponse.json({
      ...payload,
      resendResponse: data,
      message: `Test email sent to ${to}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    payload.ok = false;
    payload.error = message;
    return NextResponse.json(payload);
  }
}
