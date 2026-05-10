"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function summarizeParams(sp: URLSearchParams): string {
  const parts: string[] = [];
  if (sp.get("testMode") === "1" || sp.get("adminTest") === "1") parts.push("test harness");
  const st = sp.get("state");
  if (st) parts.push(`state=${st}`);
  const mode = sp.get("mode");
  if (mode) parts.push(`mode=${mode}`);
  if (sp.get("guestPreview") === "1") parts.push("guest preview URL");
  return parts.length > 0 ? parts.join(" · ") : "preview";
}

export function AdminTestPreviewBanner({ isAdminTester }: { isAdminTester: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { visible, label } = useMemo(() => {
    if (!isAdminTester) return { visible: false as const, label: "" };

    if (pathname.startsWith("/app/admin/test-mode")) {
      return { visible: true as const, label: "Admin Test Mode — dashboard (authorized testers only)." };
    }

    const sp = new URLSearchParams(searchParams.toString());
    const testOn = sp.get("testMode") === "1" || sp.get("adminTest") === "1";
    const guestQ = sp.get("guestPreview") === "1";
    const hasState = Boolean(sp.get("state"));
    const hasMode = Boolean(sp.get("mode"));

    if (testOn || guestQ || hasState || hasMode) {
      return {
        visible: true as const,
        label: `Previewing ${summarizeParams(sp)} — UI-only flags; avoid actions that would change real data unless intended.`,
      };
    }

    return { visible: false as const, label: "" };
  }, [isAdminTester, pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950",
        "dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-50"
      )}
    >
      Admin Test Mode — {label} No real user data should be changed unintentionally.
    </div>
  );
}
