import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupabaseCheckButton } from "@/components/supabase-check-button";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
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
              className="bg-white dark:bg-stone-900"
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
              minLength={6}
              className="bg-white dark:bg-stone-900"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          Already have an account?{" "}
          <Link
            href={
              params.redirectTo
                ? `/login?redirectTo=${encodeURIComponent(params.redirectTo)}`
                : "/login"
            }
            className="text-stone-700 dark:text-stone-300 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
