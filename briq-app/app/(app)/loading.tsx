export default function AppLoading() {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
        <div className="h-7 w-72 max-w-full bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
        <div className="h-3.5 w-96 max-w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
      </div>

      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
            <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-900 rounded mb-2" />
            <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-3" />
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-900 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
