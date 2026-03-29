import { getRelationalNetworkList } from "@/app/actions/list-of-100";
import { ListOf100Editor } from "@/components/list-of-100/list-of-100-editor";

export default async function ListOf100Page() {
  const res = await getRelationalNetworkList();

  if ("error" in res) {
    return (
      <div className="p-6">
        <p className="text-destructive">{res.error}</p>
      </div>
    );
  }

  return <ListOf100Editor initialLines={res.lines} />;
}
