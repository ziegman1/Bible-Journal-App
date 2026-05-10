export default function AppLoading() {
  console.log("[BADWR DEBUG] app/loading.tsx rendered");

  return (
    <div className="fixed inset-0 z-[99999] flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-400 p-6 text-black dark:bg-amber-600 dark:text-black">
      <p className="max-w-md text-center text-lg font-bold uppercase tracking-wide">
        BADWR DEBUG: App loading boundary rendered
      </p>
      <p className="animate-pulse text-center text-sm font-semibold text-stone-900 dark:text-stone-950">
        Loading…
      </p>
    </div>
  );
}
