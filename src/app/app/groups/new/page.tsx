import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export default async function CreateGroupPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <div>
        <Link
          href="/app/groups"
          className="text-sm text-stone-600 dark:text-stone-400 hover:underline"
        >
          ← 3/3rds Groups
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
          Create a 3/3rds Group
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
          You will be the group admin and can invite others to join.
        </p>
      </div>

      <CreateGroupForm />
    </div>
  );
}
