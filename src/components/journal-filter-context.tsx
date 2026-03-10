"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface JournalFilterContextValue {
  isPending: boolean;
  updateParams: (updates: Record<string, string | undefined>) => void;
}

const JournalFilterContext = createContext<JournalFilterContextValue | null>(null);

export function useJournalFilter() {
  const ctx = useContext(JournalFilterContext);
  return ctx;
}

interface JournalFilterProviderProps {
  children: React.ReactNode;
}

export function JournalFilterProvider({ children }: JournalFilterProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    startTransition(() => {
      router.push(`/app/journal?${next.toString()}`);
    });
  }

  return (
    <JournalFilterContext.Provider value={{ isPending, updateParams }}>
      {children}
    </JournalFilterContext.Provider>
  );
}
