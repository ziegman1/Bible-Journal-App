import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

export default function ChatInviteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex-1">{children}</div>
      <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SiteFooter variant="compact" />
      </div>
    </div>
  );
}
