import type { ReactNode } from "react";

export default function ChatInviteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {children}
    </div>
  );
}
