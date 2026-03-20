import { Resend } from "resend";

const IS_PRODUCTION =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

const GENERIC_INVITER_LABEL = "A group admin";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatExpirationDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "7 days from when the invite was sent";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "7 days from when the invite was sent";
  }
}

function buildInviteSubject(inviterName: string): string {
  const trimmed = inviterName.trim();
  if (trimmed && trimmed !== GENERIC_INVITER_LABEL) {
    return `${trimmed} invited you to join a 3/3rds Group`;
  }
  return "You're invited to join a 3/3rds Group";
}

export async function sendGroupInviteEmail(params: {
  to: string;
  inviteeName: string;
  groupName: string;
  inviterName: string;
  inviterEmail?: string | null;
  acceptUrl: string;
  /** ISO timestamp for invite expiry (from DB) */
  expiresAt?: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!resendApiKey) {
    return {
      success: false,
      error:
        "Resend is not configured. Add RESEND_API_KEY to your Vercel project environment variables.",
    };
  }

  if (IS_PRODUCTION && !fromEmail) {
    return {
      success: false,
      error:
        "Resend is not configured for production. Add RESEND_FROM_EMAIL (e.g. Bible Journal <invites@yourdomain.com>) with a verified domain. See https://resend.com/domains",
    };
  }

  const from =
    fromEmail ||
    "Bible Journal <onboarding@resend.dev>";

  const to = params.to.trim().toLowerCase();
  const inviterName = params.inviterName.trim() || GENERIC_INVITER_LABEL;
  const groupName = params.groupName.trim() || "a 3/3rds group";
  const inviteeFirst =
    params.inviteeName?.trim().split(/\s+/)[0]?.trim() ?? "";
  const greeting = inviteeFirst
    ? `Hi ${escapeHtml(inviteeFirst)},`
    : "Hi there,";
  const inviterHtml = escapeHtml(inviterName);
  const groupHtml = escapeHtml(groupName);
  const expirationNote = params.expiresAt
    ? `This invite link expires on ${escapeHtml(formatExpirationDate(params.expiresAt))}.`
    : "This invite link expires 7 days after it was sent.";

  const subject = buildInviteSubject(inviterName);

  const safeAcceptUrl =
    /^https?:\/\/[^\s<>"']+$/i.test(params.acceptUrl.trim()) &&
    params.acceptUrl.includes("/app/groups/invite/")
      ? params.acceptUrl.trim()
      : null;
  if (!safeAcceptUrl) {
    return {
      success: false,
      error:
        "Invalid invite link URL. Set NEXT_PUBLIC_SITE_URL to your production site URL.",
    };
  }

  const replyToRaw = params.inviterEmail?.trim();
  const replyTo =
    replyToRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToRaw)
      ? replyToRaw.toLowerCase()
      : undefined;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0 0 16px 0;font-size:17px;line-height:1.5;color:#1c1917;">${greeting}</p>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#44403c;">
                <strong style="color:#1c1917;">${inviterHtml}</strong> invited you to join the 3/3rds group
                <strong style="color:#1c1917;">${groupHtml}</strong> in <strong style="color:#1c1917;">Bible Journal</strong>.
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#57534e;">
                When you accept, you&apos;ll be added to that group so you can read together and journal with your group.
                Use the button below, then sign in or create an account with <strong style="color:#1c1917;">this email address</strong> (${escapeHtml(to)}).
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#292524;">
                    <a href="${safeAcceptUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fafaf9;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;">
                      Accept invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#78716c;">
                ${expirationNote}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#78716c;">
                If you didn&apos;t expect this message, you can ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a8a29e;">
                Bible Journal · 3/3rds Groups
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const textGreeting = inviteeFirst ? `Hi ${inviteeFirst},` : "Hi there,";
  const textLines = [
    textGreeting,
    "",
    `${inviterName} invited you to join the 3/3rds group "${groupName}" in Bible Journal.`,
    "",
    "When you accept, you'll be added to that group so you can read together and journal with your group.",
    `Sign in or create an account using this email address: ${to}`,
    "",
    `Accept your invitation: ${safeAcceptUrl}`,
    "",
    params.expiresAt
      ? `This invite link expires on ${formatExpirationDate(params.expiresAt)}.`
      : "This invite link expires 7 days after it was sent.",
    "",
    "If you didn't expect this message, you can ignore it.",
    "",
    "— Bible Journal",
  ];
  const text = textLines.join("\n");

  try {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Email failed to send: ${message}`,
    };
  }
}
