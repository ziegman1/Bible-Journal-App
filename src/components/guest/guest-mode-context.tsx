"use client";

import { createContext, useContext } from "react";

const GuestModeContext = createContext(false);

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  return <GuestModeContext.Provider value={true}>{children}</GuestModeContext.Provider>;
}

export function useGuestMode(): boolean {
  return useContext(GuestModeContext);
}
