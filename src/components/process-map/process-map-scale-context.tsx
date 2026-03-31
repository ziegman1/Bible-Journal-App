"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Scales fixed-px process-map chrome (nodes, plaques) to match narrow viewports.
 * Design reference: ~940px wide canvas where `nodes.ts` pixel sizes look correct.
 */
const ProcessMapScaleContext = createContext(1);

export function ProcessMapScaleProvider({
  value,
  children,
}: {
  value: number;
  children: ReactNode;
}) {
  return (
    <ProcessMapScaleContext.Provider value={value}>
      {children}
    </ProcessMapScaleContext.Provider>
  );
}

export function useProcessMapScale() {
  return useContext(ProcessMapScaleContext);
}
