import { redirect } from "next/navigation";
import { getScriptureMemorizeEntryTarget } from "@/app/actions/scripture-module";

export default async function ScriptureMemorizeEntryPage() {
  const t = await getScriptureMemorizeEntryTarget();
  if ("error" in t) {
    redirect("/scripture");
  }
  if (t.kind === "empty") {
    redirect("/scripture/my-verses");
  }
  if (t.kind === "all_mastered") {
    redirect("/scripture");
  }
  redirect(`/scripture/items/${t.itemId}/memorize`);
}
