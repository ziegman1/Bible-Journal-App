/**
 * Facilitator / TV mode: full viewport, no AppShell chrome (sidebar / welcome bar).
 * Parent app layout skips AppShell when middleware sets x-facilitator-present.
 */
export default function FacilitatorPresentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="facilitator-present-root min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-[#1c252e] antialiased">
      {children}
    </div>
  );
}
