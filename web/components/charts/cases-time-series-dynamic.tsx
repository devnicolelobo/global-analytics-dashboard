'use client';

/**
 * SSR-safe entry for the Recharts time-series panel (DEV-93 / DEV-94).
 */
import dynamic from 'next/dynamic';

import { LoadingState } from '@/components/ui/loading-state';
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
        <LoadingState message="Loading chart…" variant="panel" />
      </section>
    ),
  },
);

export function CasesTimeSeriesDynamic() {
  return <CasesTimeSeriesPanel />;
}
