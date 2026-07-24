'use client';

/**
 * SSR-safe entry for the Recharts time-series panel (DEV-93).
 *
 * Recharts/responsive-container measure DOM at render — load client-only like DEV-92 map.
 */
import dynamic from 'next/dynamic';

import { CHART_TITLE } from '@/lib/charts/constants';

const CasesTimeSeriesPanel = dynamic(
  () =>
    import('./cases-time-series-panel').then(
      (module) => module.CasesTimeSeriesPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <section aria-label={CHART_TITLE} className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          {CHART_TITLE}
        </h2>
        <p
          role="status"
          aria-live="polite"
          className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-600 sm:min-h-[280px] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          Preparing chart…
        </p>
      </section>
    ),
  },
);

export function CasesTimeSeriesDynamic() {
  return <CasesTimeSeriesPanel />;
}
