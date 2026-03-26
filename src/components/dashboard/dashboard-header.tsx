export function DashboardHeader() {
  return (
    <header className="relative min-w-0 overflow-hidden rounded-lg border border-indigo-100/40 px-4 py-4 shadow-sm dark:border-indigo-500/10 sm:px-5">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(238,242,255,0.6) 0%, rgba(245,243,255,0.3) 50%, rgba(255,251,235,0.15) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 dark:block hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(49,46,129,0.06) 0%, rgba(88,28,135,0.04) 50%, transparent 100%)",
        }}
      />
      <h1 className="relative text-xl font-serif font-light tracking-wide text-foreground sm:text-2xl">
        Dashboard
      </h1>
      <p className="relative mt-1 text-sm tracking-wide text-muted-foreground">
        Your daily rhythm, community, and growth in one place.
      </p>
    </header>
  );
}
