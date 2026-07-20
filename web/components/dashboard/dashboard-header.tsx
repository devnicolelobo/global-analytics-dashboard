export function DashboardHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Global Analytics Dashboard
        </p>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          COVID-19 country overview
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Explore persisted country-level metrics from the internal API. Map,
          KPIs, and charts will load here in upcoming sprint cards.
        </p>
      </div>
    </header>
  );
}
