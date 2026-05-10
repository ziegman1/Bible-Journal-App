"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GROWTH_MODE_DESCRIPTION,
  GROWTH_MODE_LABEL,
  GROWTH_MODES,
} from "@/lib/growth-mode/model";
import type { GrowthMode } from "@/lib/growth-mode/types";

type AIStyle = "concise" | "balanced" | "in-depth";

interface SettingsFormProps {
  displayName: string;
  aiStyle: AIStyle;
  growthMode: GrowthMode;
}

export function SettingsForm({
  displayName,
  aiStyle,
  growthMode: initialGrowthMode,
}: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(displayName);
  const [ai, setAi] = useState<AIStyle>(aiStyle);
  const [growthMode, setGrowthMode] = useState<GrowthMode>(initialGrowthMode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile({
      display_name: name,
      ai_style: ai,
      growth_mode: growthMode,
    });

    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Settings saved");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Growth Mode controls how much goal-setting, streak tracking, and performance-oriented
            feedback you see in BADWR.
          </p>
          <div className="space-y-2">
            <Label className="sr-only">Growth Mode</Label>
            <div className="flex flex-col gap-2">
              {GROWTH_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGrowthMode(m)}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    growthMode === m
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white dark:bg-stone-900/60"
                  )}
                >
                  <span className="font-medium text-foreground">{GROWTH_MODE_LABEL[m]}</span>
                  <p className="mt-1 text-muted-foreground">{GROWTH_MODE_DESCRIPTION[m]}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-stone-900"
            />
          </div>
          <div className="space-y-2">
            <Label>AI response style</Label>
            <Select value={ai} onValueChange={(v) => { if (v != null) setAi(v as AIStyle); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="in-depth">In-depth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
