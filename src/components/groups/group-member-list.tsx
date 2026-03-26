"use client";

import { useState } from "react";
import { removeGroupMember } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  email?: string | null;
}

interface GroupMemberListProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
}

export function GroupMemberList({
  groupId,
  members,
  currentUserId,
}: GroupMemberListProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(memberId: string, userId: string) {
    if (userId === currentUserId) {
      toast.error("You cannot remove yourself");
      return;
    }
    setRemoving(memberId);
    const result = await removeGroupMember(groupId, memberId);
    setRemoving(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed");
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Members ({members.length})
      </h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div>
              <p className="font-medium text-stone-800 dark:text-stone-200">
                {m.display_name}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {[m.role, m.email].filter(Boolean).join(" • ")} • Joined{" "}
                {new Date(m.joined_at).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {m.role !== "admin" && m.user_id !== currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(m.id, m.user_id)}
                disabled={removing === m.id}
              >
                <UserMinus className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
