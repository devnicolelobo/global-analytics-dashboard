'use client';

/**
 * SSR-safe entry for the Leaflet map (ADR-005 / risk R3).
 *
 * Leaflet touches window/DOM at import time — never render on the server.
 * Dashboard shell imports this wrapper instead of WorldMapPanel directly.
 */
import dynamic from 'next/dynamic';

import { LoadingState } from '@/components/ui/loading-state';

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
        <LoadingState message="Loading map…" variant="panel" panelSize="map" />
      </section>
    ),
  },
);

export function WorldMapDynamic() {
  return <WorldMapPanel />;
}
