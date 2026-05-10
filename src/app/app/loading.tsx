"use client";

import { useEffect } from "react";
import { BadwrLogo } from "@/components/badwr-logo";

export default function AppLoading() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BADWR_NAV_DIAG === "1") {
      console.info("[badwr:nav]", JSON.stringify({ event: "app_loading_mounted", t: Date.now() }));
    }
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex min-h-dvh flex-col items-center justify-center bg-white/95 px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-[1px] dark:bg-white/95"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex max-w-[120px] flex-col items-center gap-4 sm:max-w-[132px]">
        <div className="animate-pulse motion-reduce:animate-none motion-reduce:opacity-100">
          <BadwrLogo
            variant="auth"
            className="!h-[88px] !w-[88px] sm:!h-[104px] sm:!w-[104px] md:!h-[120px] md:!w-[120px]"
          />
        </div>
        <p className="text-xs font-normal tracking-wide text-stone-400">Loading…</p>
      </div>
    </div>
  );
}
