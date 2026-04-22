import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

/**
 * Public “try” tools: no app shell, no auth. Children get a simple full-height frame.
 */
export default function TryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="shrink-0 border-t border-border px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SiteFooter variant="compact" />
      </div>
    </div>
  );
}
