"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GroupsPageToolbar() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/app/groups/personal-thirds">
        <Button variant="outline" size="sm" type="button">
          Solo 3/3rds
        </Button>
      </Link>
      <Link href="/app/groups/new">
        <Button type="button">
          <Plus className="mr-2 size-4" />
          Create Group
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label="More options"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 outline-none hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => router.push("/app/groups/archived")}
            className="text-stone-800 dark:text-stone-200"
          >
            <Archive className="size-4 shrink-0" aria-hidden />
            Archived 3/3rds
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
