'use client';

/**
 * SSR-safe entry for the Leaflet map (ADR-005 / risk R3).
 *
 * Leaflet touches window/DOM at import time — never render on the server.
 * Dashboard shell imports this wrapper instead of WorldMapPanel directly.
 */
import dynamic from 'next/dynamic';

const WorldMapPanel = dynamic(
  () =>
    import('./world-map-panel').then((module) => module.WorldMapPanel),
  {
    ssr: false,
    loading: () => (
      <section aria-label="World map" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          World map
        </h2>
        <p
          role="status"
          aria-live="polite"
          className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-600 sm:min-h-[360px] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          Preparing map…
        </p>
      </section>
    ),
  },
);

export function WorldMapDynamic() {
  return <WorldMapPanel />;
}
