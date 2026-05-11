"use client";

import { useMemo } from "react";
import { presenterDensityClassFromCharCount } from "@/lib/groups/presenter-content-fit";

/** Density tier for presenter slides (spacing / line-tightening); pairs with uniform zoom in `PresenterSlideViewport`. */
export function usePresenterContentSizing(approxCharCount: number) {
  return useMemo(
    () => ({
      densityClass: presenterDensityClassFromCharCount(approxCharCount),
    }),
    [approxCharCount]
  );
}
