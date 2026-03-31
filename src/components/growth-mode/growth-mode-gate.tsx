"use client";

import type { GrowthMode } from "@/lib/growth-mode/types";
import { modeMeetsMinimum } from "@/lib/growth-mode/model";
import type { ReactNode } from "react";

/**
 * Client-side visibility helper when you already have `mode` in scope.
 * Prefer server gating via {@link getGrowthModePresentation} in RSC when possible.
 */
export function GrowthModeGate({
  currentMode,
  minMode,
  children,
}: {
  currentMode: GrowthMode;
  minMode: GrowthMode;
  children: ReactNode;
}) {
  if (!modeMeetsMinimum(currentMode, minMode)) return null;
  return children;
}
