import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  identity: ReactNode;
  daily: ReactNode;
  community: ReactNode;
  multiplication: ReactNode;
};

const gridStyle = {
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gridTemplateAreas: `
    "header header"
    "daily identity"
    "community multiplication"
  `,
} as const;

export function DashboardLayout({ header, identity, daily, community, multiplication }: Props) {
  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 md:grid md:items-stretch md:gap-6"
      style={gridStyle}
    >
      <div className="min-w-0" style={{ gridArea: "header" }}>
        {header}
      </div>
      <div className="min-w-0" style={{ gridArea: "identity" }}>
        {identity}
      </div>
      <div className="min-w-0" style={{ gridArea: "daily" }}>
        {daily}
      </div>
      <div className="min-w-0" style={{ gridArea: "community" }}>
        {community}
      </div>
      <div className="min-w-0" style={{ gridArea: "multiplication" }}>
        {multiplication}
      </div>
    </div>
  );
}
