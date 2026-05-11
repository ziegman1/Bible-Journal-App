/** Minimum scale for room-facing presenter slides (readable at distance). */
export const PRESENTER_FIT_ZOOM_MIN_DEFAULT = 0.48;
export const PRESENTER_FIT_ZOOM_MIN_PASSAGE = 0.38;

export type PresenterFitVariant = "default" | "passage";

export function presenterFitZoomMin(variant: PresenterFitVariant): number {
  return variant === "passage"
    ? PRESENTER_FIT_ZOOM_MIN_PASSAGE
    : PRESENTER_FIT_ZOOM_MIN_DEFAULT;
}

/**
 * Uniform scale to fit a rectangle inside a viewport (TV / fullscreen).
 * Returns a value in [zMin, 1].
 */
export function computePresenterUniformZoom(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
  zMin: number
): number {
  if (
    !Number.isFinite(containerW) ||
    !Number.isFinite(containerH) ||
    containerW <= 0 ||
    containerH <= 0 ||
    !Number.isFinite(contentW) ||
    !Number.isFinite(contentH) ||
    contentW <= 0 ||
    contentH <= 0
  ) {
    return 1;
  }
  const z = Math.min(1, containerW / contentW, containerH / contentH);
  return Math.max(zMin, z);
}

export function presenterDensityClassFromCharCount(
  count: number
): "presenter-density-sm" | "presenter-density-md" | "presenter-density-lg" | "presenter-density-xl" {
  if (count < 180) return "presenter-density-xl";
  if (count < 420) return "presenter-density-lg";
  if (count < 900) return "presenter-density-md";
  return "presenter-density-sm";
}
