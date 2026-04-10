/**
 * SOAPS hub: external resources (replace URLs when assets are ready).
 */
export const SOAPS_HUB_PDF_URL =
  process.env.NEXT_PUBLIC_SOAPS_PDF_URL?.trim() ||
  "https://example.com/soaps-overview.pdf";

export const SOAPS_HUB_ZUME_VIDEO_URL =
  process.env.NEXT_PUBLIC_SOAPS_ZUME_VIDEO_URL?.trim() ||
  "https://zume.training/soaps-bible-reading";
