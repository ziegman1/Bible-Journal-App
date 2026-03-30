import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import { APP_LANDING_HERO_BLURB, APP_NAME } from "@/lib/site-config";

export default async function HomePage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/app");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-stone-950">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center space-y-6">
          <h1 className="sr-only">{APP_NAME}</h1>
          <div className="flex justify-center">
            <BadwrLogo variant="hero" priority className="mx-auto" />
          </div>
          <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
            {APP_LANDING_HERO_BLURB}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/signup" className="min-h-11 inline-flex">
              <Button size="lg" className="w-full min-h-11 sm:w-auto touch-manipulation">
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="min-h-11 inline-flex">
              <Button variant="outline" size="lg" className="w-full min-h-11 sm:w-auto touch-manipulation">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="shrink-0 bg-white dark:bg-stone-950 px-4 py-8 border-t border-stone-100 dark:border-stone-800/80 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <SiteFooter />
      </div>
    </div>
  );
}
