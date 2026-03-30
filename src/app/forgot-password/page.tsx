import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { AuthFormSubmit } from "@/components/auth-form-submit";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
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
            Reset password
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {params.error && (
          <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-lg space-y-2">
            <p className="font-medium">{params.error}</p>
            {(params.error.toLowerCase().includes("connect") ||
              params.error.toLowerCase().includes("internet") ||
              params.error.toLowerCase().includes("fetch")) && (
              <p className="text-stone-600 dark:text-stone-400 text-xs">
                If the problem persists, verify Supabase is configured in .env.local.
              </p>
            )}
          </div>
        )}
        {params.message && (
          <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {params.message}
          </p>
        )}
        <form action={resetPassword} className="space-y-4">
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
          <AuthFormSubmit label="Send reset link" pendingLabel="Sending…" />
        </form>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          <Link
            href="/login"
            className="text-stone-700 dark:text-stone-300 underline min-h-[44px] inline-flex items-center justify-center"
          >
            Back to sign in
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
