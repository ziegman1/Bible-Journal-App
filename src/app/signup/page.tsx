import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { AuthFormSubmit } from "@/components/auth-form-submit";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupabaseCheckButton } from "@/components/supabase-check-button";
import { APP_MARKETING_NAME } from "@/lib/site-config";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const authFieldClass =
    "bg-white dark:bg-stone-900 h-11 min-h-[44px] text-base sm:text-sm";
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <BadwrLogo variant="auth" priority />
          </div>
          <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
            {APP_MARKETING_NAME}
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Create your account
          </p>
        </div>

        {params.error && (
          <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-lg space-y-3">
            <p className="font-medium">{params.error}</p>
            {(params.error.toLowerCase().includes("connect") ||
              params.error.toLowerCase().includes("internet") ||
              params.error.toLowerCase().includes("fetch")) && (
              <>
                <p className="text-stone-600 dark:text-stone-400 text-xs">
                  If the problem persists, verify Supabase is configured in .env.local.
                </p>
                <SupabaseCheckButton />
              </>
            )}
          </div>
        )}
        <form action={signUp} className="space-y-4">
          {params.redirectTo && (
            <input type="hidden" name="redirectTo" value={params.redirectTo} />
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Your name"
              required
              autoComplete="name"
              className={authFieldClass}
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              className={authFieldClass}
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-500 leading-relaxed text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
          <AuthFormSubmit label="Sign Up" pendingLabel="Creating account…" />
        </form>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          Already have an account?{" "}
          <Link
            href={
              params.redirectTo
                ? `/login?redirectTo=${encodeURIComponent(params.redirectTo)}`
                : "/login"
            }
            className="text-stone-700 dark:text-stone-300 underline min-h-[44px] inline-flex items-center justify-center"
          >
            Sign in
          </Link>
        </p>
      </div>
      </div>
      <div className="shrink-0 px-4 py-6 border-t border-border pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SiteFooter variant="compact" />
      </div>
    </div>
  );
}
