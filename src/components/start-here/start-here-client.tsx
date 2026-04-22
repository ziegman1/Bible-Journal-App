"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAppExperienceMode } from "@/app/actions/app-experience";
import type { AppExperienceMode } from "@/lib/app-experience-mode/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OPTIONS: {
  mode: AppExperienceMode;
  title: string;
  description: string;
  cta: string;
  emphasis?: boolean;
}[] = [
  {
    mode: "journey",
    title: "Guided Journey",
    description:
      "A step-by-step path for beginners to learn and practice biblical discipleship one principle at a time.",
    cta: "Start guided journey",
    emphasis: true,
  },
  {
    mode: "custom",
    title: "Build Your Dashboard",
    description:
      "Choose the tools you want to focus on and create a simplified dashboard that fits where you are.",
    cta: "Customize my dashboard",
  },
  {
    mode: "full",
    title: "Full Experience",
    description: "Access the full dashboard and all available tools right away.",
    cta: "Open full dashboard",
  },
];

export function StartHereClient() {
  const router = useRouter();
  const [pending, setPending] = useState<AppExperienceMode | null>(null);

  async function choose(mode: AppExperienceMode) {
    setPending(mode);
    const result = await setAppExperienceMode(mode);
    setPending(null);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if ("redirectTo" in result && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
      {OPTIONS.map((opt) => (
        <Card
          key={opt.mode}
          className={cn(
            "flex flex-col border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/60 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md",
            opt.emphasis && "ring-2 ring-primary/20 md:scale-[1.02]"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif font-normal text-stone-900 dark:text-stone-50">
              {opt.title}
            </CardTitle>
            <CardDescription className="text-stone-600 dark:text-stone-400 min-h-[4.5rem]">
              {opt.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="pt-0">
            <Button
              type="button"
              className="w-full"
              variant={opt.emphasis ? "default" : "secondary"}
              disabled={pending !== null}
              onClick={() => void choose(opt.mode)}
            >
              {pending === opt.mode ? "Saving…" : opt.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
