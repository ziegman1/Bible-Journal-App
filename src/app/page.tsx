import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 px-4">
      <div className="max-w-lg text-center space-y-8">
        <h1 className="text-4xl font-serif font-light text-stone-800 dark:text-stone-200 tracking-tight">
          Bible Journal
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-lg leading-relaxed">
          Your Scripture-first journaling platform. Read, reflect, ask questions,
          and compile your spiritual journey into a meaningful annual record.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
