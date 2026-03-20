import { Resend } from "resend";

export async function sendGroupInviteEmail(params: {
  to: string;
  inviteeName: string;
  groupName: string;
  inviterName: string;
  acceptUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // TEMP DEBUG: safe env state (no secrets). Remove after diagnosis.
  console.debug("[email-helper] sendGroupInviteEmail env check:", {
    hasResendKey: !!resendApiKey,
    resendKeyLength: resendApiKey?.length ?? 0,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });

  if (!resendApiKey) {
    return { success: false, error: "Email not configured (RESEND_API_KEY) [email-helper]" };
  }

  const resend = new Resend(resendApiKey);
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Bible Journal <onboarding@resend.dev>";

  const greeting = params.inviteeName
    ? `Hi ${params.inviteeName},`
    : "Hi,";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <p>${greeting}</p>
  <p><strong>${params.inviterName}</strong> has invited you to join the 3/3rds group <strong>${params.groupName}</strong> on Bible Journal.</p>
  <p>Click the link below to accept the invite and join the group. You'll need to sign in (or create an account) with this email address.</p>
  <p style="margin: 24px 0;">
    <a href="${params.acceptUrl}" style="display: inline-block; background: #1a1a1a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Accept invite</a>
  </p>
  <p style="font-size: 14px; color: #666;">This link expires in 7 days. If you didn't expect this invite, you can ignore this email.</p>
  <p style="font-size: 14px; color: #666; margin-top: 32px;">— Bible Journal</p>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `You're invited to join ${params.groupName} on Bible Journal`,
    html,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
