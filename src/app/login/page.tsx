import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
            Bible Journal
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Sign in to continue your journey
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
            {(params.error.toLowerCase().includes("expired") ||
              params.error.toLowerCase().includes("invalid") ||
              params.error.toLowerCase().includes("auth failed")) && (
              <p className="text-stone-600 dark:text-stone-400 text-xs">
                Sign in with your password below, or sign up again to receive a new confirmation link.
              </p>
            )}
          </div>
        )}
        {params.message && (
          <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {params.message}
          </p>
        )}
        <form action={signIn} className="space-y-4">
          {params.redirectTo && (
            <input type="hidden" name="redirectTo" value={params.redirectTo} />
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="bg-white dark:bg-stone-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bg-white dark:bg-stone-900"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 space-x-2">
          <Link href="/forgot-password" className="text-stone-700 dark:text-stone-300 underline">
            Forgot password?
          </Link>
          <span>·</span>
          <Link href="/signup" className="text-stone-700 dark:text-stone-300 underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
