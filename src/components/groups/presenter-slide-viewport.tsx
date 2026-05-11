"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  computePresenterUniformZoom,
  presenterFitZoomMin,
  type PresenterFitVariant,
} from "@/lib/groups/presenter-content-fit";
import { cn } from "@/lib/utils";

function cssZoomSupported(): boolean {
  return typeof CSS !== "undefined" && CSS.supports?.("zoom", "1");
}

export type PresenterSlideLayout = "center" | "tall";

type Props = {
  presentationKey: string;
  children: ReactNode;
  variant?: PresenterFitVariant;
  /** `tall`: height-filling slides (e.g. Obey/Share/Train) — measure at natural height, align top. */
  layout?: PresenterSlideLayout;
  /** From `usePresenterContentSizing` / `presenterDensityClassFromCharCount` — tightens vertical rhythm. */
  densityClass?: string;
  className?: string;
};

/**
 * Fits slide markup into the stage (targets 100dvh minus chrome — parent must be flex + min-h-0).
 * Prefers CSS `zoom` (layout-sized); falls back to transform + clip for older Firefox.
 */
export function PresenterSlideViewport({
  presentationKey,
  children,
  variant = "default",
  layout = "center",
  densityClass,
  className,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [ffBox, setFfBox] = useState<{
    z: number;
    sw: number;
    sh: number;
  } | null>(null);

  const zMin = presenterFitZoomMin(variant);
  const useZoom = cssZoomSupported();
  const tall = layout === "tall";

  const fit = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const clip = clipRef.current;
    if (!outer || !inner || !clip) return;

    inner.style.zoom = "1";
    inner.style.transform = "";
    inner.style.transformOrigin = "";
    inner.style.width = "";
    inner.style.height = "";
    inner.style.flex = "";
    inner.style.alignSelf = "";
    inner.style.display = "";
    inner.style.maxWidth = "";
    clip.style.width = "";
    clip.style.height = "";
    clip.style.overflow = "";
    setFfBox(null);

    const cw = outer.clientWidth;
    const ch = outer.clientHeight;
    if (cw < 16 || ch < 16) return;

    if (tall) {
      inner.style.display = "block";
      inner.style.width = "100%";
      inner.style.maxWidth = "none";
      inner.style.height = "auto";
      inner.style.flex = "0 0 auto";
      inner.style.alignSelf = "stretch";
    } else {
      inner.style.display = "inline-block";
      inner.style.maxWidth = "none";
    }

    const sw = Math.max(inner.scrollWidth, inner.offsetWidth);
    const sh = Math.max(inner.scrollHeight, inner.offsetHeight);

    inner.style.display = "";
    inner.style.maxWidth = "";
    inner.style.width = "";
    inner.style.height = "";
    inner.style.flex = "";
    inner.style.alignSelf = "";

    if (sw < 1 || sh < 1) return;

    const z = computePresenterUniformZoom(cw, ch, sw, sh, zMin);

    if (useZoom) {
      (inner as HTMLElement).style.zoom = String(z);
      return;
    }

    setFfBox({ z, sw, sh });
    clip.style.width = `${sw * z}px`;
    clip.style.height = `${sh * z}px`;
    clip.style.overflow = "hidden";
    inner.style.width = `${sw}px`;
    inner.style.height = `${sh}px`;
    inner.style.transform = `scale(${z})`;
    inner.style.transformOrigin = "top left";
  }, [useZoom, zMin, tall]);

  useLayoutEffect(() => {
    fit();
    const outer = outerRef.current;
    if (!outer) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fit());
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(outer);

    window.addEventListener("resize", schedule);
    document.addEventListener("fullscreenchange", schedule);
    document.addEventListener("webkitfullscreenchange", schedule);

    const t = window.setTimeout(schedule, 160);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      document.removeEventListener("fullscreenchange", schedule);
      document.removeEventListener("webkitfullscreenchange", schedule);
    };
  }, [presentationKey, layout, fit]);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
        className
      )}
    >
      <div
        ref={outerRef}
        className={cn(
          "flex min-h-0 w-full flex-1 overflow-hidden",
          tall ? "items-start justify-center" : "items-center justify-center"
        )}
      >
        <div
          ref={clipRef}
          className={cn(
            "flex min-h-0 min-w-0 justify-center",
            tall ? "w-full" : "items-center",
            useZoom || !ffBox ? "h-full w-full max-w-full" : ""
          )}
        >
          <div
            ref={innerRef}
            className={cn(
              "presenter-slide-fit-inner w-full min-w-0 max-w-none",
              densityClass
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
