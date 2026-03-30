import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";

export default function SetupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-stone-950">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center space-y-8">
        <h1 className="sr-only">Supabase not configured</h1>
        <div className="flex justify-center">
          <BadwrLogo variant="hero" priority />
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 text-left space-y-4">
          <h2 className="text-lg font-medium text-amber-900 dark:text-amber-100">
            Supabase not configured
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Add your Supabase credentials to <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">.env.local</code> to enable authentication and data storage.
          </p>
          <ol className="text-sm text-amber-800 dark:text-amber-200 list-decimal list-inside space-y-2">
            <li>Copy <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">.env.example</code> to <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">.env.local</code></li>
            <li>Get your project URL and anon key from{" "}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Supabase API settings
              </a>
            </li>
            <li>Restart the dev server after updating the env file</li>
          </ol>
          <pre className="text-xs bg-stone-100 dark:bg-stone-900 p-4 rounded overflow-x-auto text-left">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
        </div>
        <Link href="/">
          <Button variant="outline" size="lg" className="min-h-11 touch-manipulation">
            Back to home
          </Button>
        </Link>
        </div>
      </div>
      <div className="shrink-0 bg-white dark:bg-stone-950 px-4 py-8 border-t border-stone-100 dark:border-stone-800/80 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <SiteFooter />
      </div>
    </div>
  );
}
