"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authLog } from "@/lib/auth-debug";
import { isAllowedPostAuthPath } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function mapPasswordLoginError(raw: string | undefined): string {
  const m = (raw ?? "").toLowerCase();
  if (m.includes("fetch") || m.includes("network")) {
    return "Unable to connect. Please check your internet connection and try again.";
  }
  return raw ?? "Something went wrong. Please try again.";
}

export function LoginPasswordForm({
  redirectTo,
  authFieldClass,
}: {
  redirectTo?: string;
  authFieldClass: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const target = useMemo(
    () =>
      redirectTo && isAllowedPostAuthPath(redirectTo) ? redirectTo : "/app",
    [redirectTo]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = (fd.get("email") as string) ?? "";
    const password = (fd.get("password") as string) ?? "";

    authLog("login_attempt_started", { method: "password" });
    setPending(true);

    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signErr) {
      authLog("login_failure", {
        method: "password",
        code: signErr.name ?? "auth_error",
      });
      setError(mapPasswordLoginError(signErr.message));
      setPending(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    authLog("login_success", { method: "password" });
    authLog("session_after_login", {
      hasSession: !!sessionData.session,
      expiresAt: sessionData.session?.expires_at ?? 0,
    });

    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/auth/login-password-form.tsx — await #1");

    await router.refresh();
    router.push(target);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-lg space-y-2">
          <p className="font-medium">{error}</p>
          {(error.toLowerCase().includes("connect") ||
            error.toLowerCase().includes("internet") ||
            error.toLowerCase().includes("fetch")) && (
            <p className="text-stone-600 dark:text-stone-400 text-xs">
              If the problem persists, verify Supabase is configured in .env.local.
            </p>
          )}
          {(error.toLowerCase().includes("expired") ||
            error.toLowerCase().includes("invalid") ||
            error.toLowerCase().includes("auth failed")) && (
            <p className="text-stone-600 dark:text-stone-400 text-xs">
              Sign in with your password below, or sign up again to receive a new confirmation link.
            </p>
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={authFieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={authFieldClass}
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full min-h-11 text-base sm:text-sm"
        aria-busy={pending}
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Please wait…
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
