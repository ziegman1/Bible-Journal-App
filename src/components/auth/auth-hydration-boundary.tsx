"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authLog } from "@/lib/auth-debug";
import { navDiagAlways } from "@/lib/debug/nav-diag";

type Phase = "loading" | "ready" | "error";

const GET_SESSION_TIMEOUT_MS = 14_000;

/**
 * Waits for the first {@link import("@supabase/supabase-js").Session | Session} read on the client
 * before rendering children, so the app shell does not flash before the browser restores auth cookies.
 */
export function AuthHydrationBoundary({
  children,
  /** Browser guest mode: no Supabase session — do not wait on auth or redirect to login. */
  allowAnonymous = false,
}: {
  children: React.ReactNode;
  allowAnonymous?: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(() => (allowAnonymous ? "ready" : "loading"));

  useEffect(() => {
    if (allowAnonymous) return;
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

    void (async () => {
      navDiagAlways("auth_hydration_getsession_start", {});
      const timeout = new Promise<"timeout">((resolve) => {
        setTimeout(() => resolve("timeout"), GET_SESSION_TIMEOUT_MS);
      });
      const sessionResult = supabase.auth.getSession().then((r) => ({ ok: true as const, r }));
      const raced = await Promise.race([sessionResult, timeout]);
      if (cancelled) return;

      if (raced === "timeout") {
        navDiagAlways("auth_hydration_getsession_timeout", { ms: GET_SESSION_TIMEOUT_MS });
        authLog("get_session_timeout", { ms: GET_SESSION_TIMEOUT_MS });
        setPhase("error");
        return;
      }

      const { data } = raced.r;
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
      navDiagAlways("auth_hydration_getsession_ready", {});
      setPhase("ready");
    })();

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
  }, [router, allowAnonymous]);

  if (allowAnonymous) {
    return <>{children}</>;
  }

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

  if (phase === "error") {
    return (
      <div
        className="mx-auto flex max-w-md flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
        role="alert"
      >
        <p className="font-medium">We could not confirm your session in time.</p>
        <p className="text-xs text-amber-900/80 dark:text-amber-200/90">
          This usually means the browser could not reach Supabase auth, or the tab was suspended. Check
          the console for <code className="rounded bg-amber-200/80 px-1 dark:bg-amber-900/60">[badwr:nav]</code>.
        </p>
        <button
          type="button"
          className="rounded-md bg-amber-900 px-3 py-2 text-center text-sm font-medium text-white dark:bg-amber-200 dark:text-amber-950"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
