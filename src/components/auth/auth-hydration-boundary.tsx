"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authLog } from "@/lib/auth-debug";

type Phase = "loading" | "ready";

/**
 * Waits for the first {@link import("@supabase/supabase-js").Session | Session} read on the client
 * before rendering children, so the app shell does not flash before the browser restores auth cookies.
 */
export function AuthHydrationBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loginUrlWithReturn = () => {
      const back =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/app";
      const q = new URLSearchParams({ redirectTo: back });
      return `/login?${q.toString()}`;
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const session = data.session;
      authLog("session_on_app_boot", {
        hasSession: !!session,
        expiresAt: session?.expires_at ?? 0,
      });
      if (!session) {
        authLog("redirect_to_login", {
          reason: "client_getsession_empty",
        });
        router.replace(loginUrlWithReturn());
        return;
      }
      setPhase("ready");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[BADWR DEBUG] auth state change", { event, hasSession: !!session });
      authLog("auth_state_change", {
        event,
        hasSession: !!session,
      });
      if (event === "INITIAL_SESSION") {
        return;
      }
      if (!session) {
        authLog("redirect_to_login", {
          reason: `auth_state_${event}`,
        });
        router.replace(loginUrlWithReturn());
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (phase === "loading") {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-stone-500 dark:text-stone-400"
        aria-busy="true"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Loading session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
