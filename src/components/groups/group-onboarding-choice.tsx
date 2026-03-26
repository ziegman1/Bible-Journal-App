"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGroupOnboardingChoice } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  groupId: string;
  groupName: string;
}

export function GroupOnboardingChoice({ groupId, groupName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"starter_track" | "experienced" | null>(null);

  async function choose(choice: "starter_track" | "experienced") {
    setPending(choice);
    const r = await saveGroupOnboardingChoice(groupId, choice);
    setPending(null);
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    if ("redirectTo" in r && r.redirectTo) {
      router.push(r.redirectTo);
      router.refresh();
    }
  }

  return (
    <Card className="max-w-2xl mx-auto border-amber-200/70 dark:border-amber-900/40 shadow-sm">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <CardTitle className="text-xl sm:text-2xl font-serif font-light text-stone-900 dark:text-stone-100">
          How familiar is your group with 3/3rds?
        </CardTitle>
        <CardDescription className="text-base text-stone-600 dark:text-stone-400">
          <span className="font-medium text-stone-800 dark:text-stone-200">{groupName}</span>
          <span className="block mt-3 text-left text-sm">
            Choose the option that best describes your group. You’ll use this to set up meetings
            the right way.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          If anyone needs to learn the rhythm, the Starter Track walks you through eight weeks of
          guided passages and practice. If everyone already runs 3/3rds meetings, you’ll go
          straight to story sets — without the Starter Track shortcut on this workspace.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          size="lg"
          className="w-full sm:flex-1 h-auto min-h-12 py-3 whitespace-normal text-left justify-start"
          onClick={() => choose("starter_track")}
          disabled={pending !== null}
        >
          {pending === "starter_track" ? (
            <Loader2 className="size-5 animate-spin shrink-0 mr-2" />
          ) : (
            <Sparkles className="size-5 shrink-0 mr-2 text-amber-200" />
          )}
          <span>
            <span className="block font-semibold">
              I or someone in the group is new to 3/3rds
            </span>
            <span className="block text-xs font-normal opacity-90 mt-0.5">
              Use the Starter Track — you’ll see it on your group workspace
            </span>
          </span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:flex-1 h-auto min-h-12 py-3 whitespace-normal text-left justify-start border-stone-300 dark:border-stone-600"
          onClick={() => choose("experienced")}
          disabled={pending !== null}
        >
          {pending === "experienced" ? (
            <Loader2 className="size-5 animate-spin shrink-0 mr-2" />
          ) : (
            <BookOpen className="size-5 shrink-0 mr-2" />
          )}
          <span>
            <span className="block font-semibold">
              Everyone in the group is experienced with 3/3rds
            </span>
            <span className="block text-xs font-normal opacity-80 mt-0.5">
              Story sets only — no Starter Track button on this workspace
            </span>
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
