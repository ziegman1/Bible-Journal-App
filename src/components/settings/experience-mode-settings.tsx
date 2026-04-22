"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppExperienceMode } from "@/app/actions/app-experience";
import type { AppExperienceMode } from "@/lib/app-experience-mode/types";
import { APP_EXPERIENCE_MODE_LABEL } from "@/lib/app-experience-mode/model";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

const MODES: AppExperienceMode[] = ["journey", "custom", "full"];

interface ExperienceModeSettingsProps {
  currentMode: AppExperienceMode;
}

export function ExperienceModeSettings({ currentMode }: ExperienceModeSettingsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AppExperienceMode>(currentMode);
  const [saving, setSaving] = useState(false);

  async function applyChange(next: AppExperienceMode) {
    if (next === currentMode) return;
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(
            "Changing your experience mode may change which dashboard sections appear and where you land after sign-in. Continue?"
          );
    if (!ok) {
      setMode(currentMode);
      return;
    }
    setSaving(true);
    const result = await updateAppExperienceMode(next);
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setMode(currentMode);
      return;
    }
    toast.success("Experience mode updated");
    router.refresh();
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-base">App experience</CardTitle>
        <CardDescription>
          Guided Journey introduces tools gradually. Build Your Dashboard shows only the sections you
          pick. Full Experience is the complete BADWR home.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">Mode</span>
          <Select
            value={mode}
            onValueChange={(v) => {
              if (!MODES.includes(v as AppExperienceMode)) return;
              const next = v as AppExperienceMode;
              setMode(next);
              void applyChange(next);
            }}
            disabled={saving}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {APP_EXPERIENCE_MODE_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === "custom" && (
          <Link
            href="/app/dashboard-setup"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
          >
            Edit dashboard modules
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
