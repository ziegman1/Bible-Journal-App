export default function JournalEntryLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="h-4 w-28 bg-stone-200 dark:bg-stone-700 rounded mb-8" />
      <div className="h-4 w-48 bg-stone-200 dark:bg-stone-700 rounded mb-2" />
      <div className="h-8 w-64 bg-stone-200 dark:bg-stone-700 rounded mb-6" />
      <div className="space-y-6">
        <div className="h-24 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        <div className="h-48 bg-stone-100 dark:bg-stone-800 rounded-lg" />
      </div>
    </div>
  );
}
