"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type ReadingMode = "canonical" | "chronological" | "custom" | "free_reading";
type AIStyle = "concise" | "balanced" | "in-depth";

interface SettingsFormProps {
  displayName: string;
  readingMode: ReadingMode;
  journalYear: number;
  aiStyle: AIStyle;
}

export function SettingsForm({
  displayName,
  readingMode,
  journalYear,
  aiStyle,
}: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(displayName);
  const [reading, setReading] = useState<ReadingMode>(readingMode);
  const [year, setYear] = useState(journalYear);
  const [ai, setAi] = useState<AIStyle>(aiStyle);

  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile({
      display_name: name,
      reading_mode: reading,
      journal_year: year,
      ai_style: ai,
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
            <Label>Reading mode</Label>
            <Select value={reading} onValueChange={(v) => { if (v != null) setReading(v as ReadingMode); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canonical">Canonical (book order)</SelectItem>
                <SelectItem value="chronological">Chronological</SelectItem>
                <SelectItem value="custom">Custom plan</SelectItem>
                <SelectItem value="free_reading">Free reading</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Journal year</Label>
            <Select value={String(year)} onValueChange={(v) => { if (v != null) setYear(parseInt(String(v), 10)); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
