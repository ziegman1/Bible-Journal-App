import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  identity: ReactNode;
  daily: ReactNode;
  context: ReactNode;
  community: ReactNode;
  growth: ReactNode;
};

const gridStyle = {
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 420px) minmax(0, 1.2fr)",
  gridTemplateAreas: `
    "header header header"
    "daily identity context"
    "community growth context"
  `,
} as const;

export function DashboardLayout({
  header,
  identity,
  daily,
  context,
  community,
  growth,
}: Props) {
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
      <div className="min-w-0 md:self-stretch" style={{ gridArea: "context" }}>
        {context}
      </div>
      <div className="min-w-0" style={{ gridArea: "community" }}>
        {community}
      </div>
      <div className="min-w-0" style={{ gridArea: "growth" }}>
        {growth}
      </div>
    </div>
  );
}
