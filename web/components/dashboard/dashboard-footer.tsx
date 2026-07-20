export function DashboardFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <p>Data source and last sync time will appear here.</p>
        <p>Served from persisted backend storage — not live upstream calls.</p>
      </div>
    </footer>
  );
}
