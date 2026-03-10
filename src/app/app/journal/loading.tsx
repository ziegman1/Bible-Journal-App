export default function JournalLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-32 bg-stone-200 dark:bg-stone-700 rounded mb-2" />
      <div className="h-4 w-80 bg-stone-200 dark:bg-stone-700 rounded mb-8" />
      <div className="h-10 w-full max-w-md bg-stone-100 dark:bg-stone-800 rounded mb-8" />
      <div className="space-y-6">
        <div className="h-36 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        <div className="h-36 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        <div className="h-36 bg-stone-100 dark:bg-stone-800 rounded-lg" />
      </div>
    </div>
  );
}
