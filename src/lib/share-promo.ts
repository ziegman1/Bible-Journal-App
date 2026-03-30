import { getSharePromoAttributionLabel } from "@/lib/site-config";
import { getPublicSiteBaseUrl } from "@/lib/public-site-url";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain footer for mailto/SMS and Resend text parts. */
export function getSharePromoPlainFooter(): string {
  const url = getPublicSiteBaseUrl();
  const label = getSharePromoAttributionLabel();
  return `\n\n—\nSent from ${label}\n${url}`;
}

/**
 * Appended to user-composed email and SMS bodies so recipients see where it came from.
 * Plain text only (mailto / sms: / clipboard).
 */
export function appendSharePromoToPlainText(body: string): string {
  const footer = getSharePromoPlainFooter();
  const core = body.trimEnd();
  const url = getPublicSiteBaseUrl();
  const label = getSharePromoAttributionLabel();
  if (!core) {
    return `Sent from ${label}\n${url}`;
  }
  return `${core}${footer}`;
}

/**
 * Bottom block for transactional HTML emails (invite messages, etc.).
 * `productTagline` is the existing brand line, e.g. "Logosflow · CHAT".
 */
export function emailInviteFooterHtml(productTagline: string): string {
  const url = getPublicSiteBaseUrl();
  const href = escapeHtml(url);
  const tag = escapeHtml(productTagline.trim());
  const label = escapeHtml(getSharePromoAttributionLabel());
  return `<tr>
            <td style="padding:20px 28px 28px 28px;border-top:1px solid #f5f5f4;">
              <p style="margin:0 0 10px 0;font-size:12px;line-height:1.5;color:#a8a29e;">
                Sent from <a href="${href}" style="color:#57534e;text-decoration:underline;">${label}</a>
              </p>
              <p style="margin:0 0 12px 0;font-size:12px;line-height:1.4;color:#a8a29e;">
                <a href="${href}" style="color:#57534e;text-decoration:underline;">${href}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a8a29e;">${tag}</p>
            </td>
          </tr>`;
}
