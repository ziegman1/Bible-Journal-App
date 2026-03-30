import { Resend } from "resend";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";
import {
  appendSharePromoToPlainText,
  emailInviteFooterHtml,
} from "@/lib/share-promo";

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

function buildChatInviteSubject(inviterName: string): string {
  const trimmed = inviterName.trim();
  if (trimmed && trimmed !== GENERIC_INVITER_LABEL) {
    return `${trimmed} invited you to a CHAT group on Logosflow`;
  }
  return "You're invited to a CHAT accountability group on Logosflow";
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
  /** CHAT accountability groups use different copy */
  inviteKind?: "thirds" | "chat";
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
  const isChat = params.inviteKind === "chat";
  const groupName = params.groupName.trim() || (isChat ? "CHAT group" : "a 3/3rds group");
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

  const subject = isChat
    ? buildChatInviteSubject(inviterName)
    : buildInviteSubject(inviterName);

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
                ${
                  isChat
                    ? `<strong style="color:#1c1917;">${inviterHtml}</strong> invited you to join the CHAT accountability group
                <strong style="color:#1c1917;">${groupHtml}</strong> on <strong style="color:#1c1917;">Logosflow</strong>.`
                    : `<strong style="color:#1c1917;">${inviterHtml}</strong> invited you to join the 3/3rds group
                <strong style="color:#1c1917;">${groupHtml}</strong> in <strong style="color:#1c1917;">Bible Journal</strong>.`
                }
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#57534e;">
                ${
                  isChat
                    ? `A CHAT group is 2–3 people of the same gender who meet weekly for spiritual accountability: Check your progress, Hear the Word, Act on it, and Tell others—no curriculum required.
                Use the button below, then sign in or create an account with <strong style="color:#1c1917;">this email address</strong> (${escapeHtml(to)}).`
                    : `When you accept, you&apos;ll be added to that group so you can read together and journal with your group.
                Use the button below, then sign in or create an account with <strong style="color:#1c1917;">this email address</strong> (${escapeHtml(to)}).`
                }
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
          ${emailInviteFooterHtml(isChat ? "Logosflow · CHAT groups" : "Bible Journal · 3/3rds Groups")}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const textGreeting = inviteeFirst ? `Hi ${inviteeFirst},` : "Hi there,";
  const textLines = isChat
    ? [
        textGreeting,
        "",
        `${inviterName} invited you to join the CHAT group "${groupName}" on Logosflow.`,
        "",
        "CHAT groups are 2–3 same-gender friends meeting weekly for accountability: Check progress, Hear the Word, Act on it, Tell others.",
        "",
        `Sign in or create an account using this email address: ${to}`,
        "",
        `Accept: ${safeAcceptUrl}`,
        "",
        params.expiresAt
          ? `This invite link expires on ${formatExpirationDate(params.expiresAt)}.`
          : "This invite link expires 7 days after it was sent.",
        "",
        "If you didn't expect this message, you can ignore it.",
      ]
    : [
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
      ];
  const text = appendSharePromoToPlainText(textLines.join("\n"));

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

function isSafeChatGrowthInviteUrl(candidate: string): boolean {
  try {
    const u = new URL(candidate.trim());
    const base = new URL(getPublicSiteBaseUrl());
    if (u.origin !== base.origin) return false;
    return /^\/chat\/invite\/[^/]+\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}

/** Growth / “share CHAT” invite — no group or workspace data; links to public learn-more page. */
export async function sendChatGrowthInviteEmail(params: {
  to: string;
  recipientName: string;
  senderName: string;
  senderEmail?: string | null;
  invitePageUrl: string;
  personalNote?: string | null;
  subject: string;
  frameworkBlurb: string;
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
        "Resend is not configured for production. Add RESEND_FROM_EMAIL with a verified domain.",
    };
  }

  const from =
    fromEmail || "Bible Journal <onboarding@resend.dev>";

  const to = params.to.trim().toLowerCase();
  const inviteUrl = params.invitePageUrl.trim();
  if (!isSafeChatGrowthInviteUrl(inviteUrl)) {
    return {
      success: false,
      error: "Invalid invite link. Check NEXT_PUBLIC_SITE_URL matches your deployment.",
    };
  }

  const senderName = params.senderName.trim() || "A friend";
  const recipientFirst =
    params.recipientName.trim().split(/\s+/)[0]?.trim() ?? "";
  const greeting = recipientFirst
    ? `Hi ${escapeHtml(recipientFirst)},`
    : "Hi there,";

  const noteRaw = params.personalNote?.trim();
  const noteBlock =
    noteRaw && noteRaw.length > 0
      ? `<p style="margin:0 0 20px 0;padding:16px 18px;background-color:#fafaf9;border-left:4px solid #d6d3d1;border-radius:8px;font-size:15px;line-height:1.6;color:#44403c;"><strong style="color:#1c1917;">A note from ${escapeHtml(senderName)}:</strong><br><span style="white-space:pre-wrap;">${escapeHtml(noteRaw)}</span></p>`
      : "";

  const subject = params.subject.trim() || "You're invited to start a CHAT Group";
  const blurb = escapeHtml(params.frameworkBlurb.trim());

  const replyToRaw = params.senderEmail?.trim();
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
                <strong style="color:#1c1917;">${escapeHtml(senderName)}</strong> invited you to explore starting a CHAT Group.
              </p>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#57534e;">${blurb}</p>
              ${noteBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#292524;">
                    <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fafaf9;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;">
                      Get Started with CHAT
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
                <tr>
                  <td style="border-radius:8px;border:1px solid #d6d3d1;">
                    <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#44403c;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;">
                      Learn More
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#78716c;">
                If you didn&apos;t expect this message, you can ignore it.
              </p>
            </td>
          </tr>
          ${emailInviteFooterHtml("Logosflow · CHAT")}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const textLines = [
    recipientFirst ? `Hi ${recipientFirst},` : "Hi there,",
    "",
    `${senderName} invited you to explore starting a CHAT Group.`,
    "",
    params.frameworkBlurb.trim(),
    "",
    noteRaw ? `Note from ${senderName}:\n${noteRaw}\n` : "",
    "Get Started with CHAT (same link as Learn More):",
    inviteUrl,
    "",
    "If you didn't expect this message, you can ignore it.",
  ].filter(Boolean);
  const text = appendSharePromoToPlainText(textLines.join("\n"));

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
