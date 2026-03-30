import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BadwrLogo } from "@/components/badwr-logo";
import { SiteFooter } from "@/components/site-footer";
import {
  APP_LANDING_HERO_BLURB,
  APP_NAME,
  APP_TAGLINE,
} from "@/lib/site-config";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center space-y-6">
          <div className="flex justify-center">
            <BadwrLogo variant="hero" priority className="mx-auto" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-light text-stone-900 dark:text-stone-100 tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-lg sm:text-xl text-stone-700 dark:text-stone-300 font-light leading-snug">
            {APP_TAGLINE}
          </p>
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
      <div className="shrink-0 px-4 py-8 border-t border-stone-200/80 dark:border-stone-800/80 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <SiteFooter />
      </div>
    </div>
  );
}
