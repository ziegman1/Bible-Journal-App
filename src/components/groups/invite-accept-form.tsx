"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptGroupInvite } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteAcceptFormProps {
  token: string;
}

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      setError("First name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await acceptGroupInvite(token, first, last || undefined);
    setSubmitting(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("success" in result && result.success && result.groupId) {
      router.push(`/app/groups/${result.groupId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-stone-600 dark:text-stone-400">
        Enter the name you want shown in this group’s member list.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            disabled={submitting}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Joining…" : "Join group"}
      </Button>
    </form>
  );
}
