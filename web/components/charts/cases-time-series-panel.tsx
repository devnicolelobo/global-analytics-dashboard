'use client';

/**
 * Confirmed cases chart section — data loading + states (DEV-93 / DEV-94).
 */
import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  CHART_EMPTY_MESSAGE,
  CHART_TITLE,
} from '@/lib/charts/constants';
import { useCasesTimeSeriesData } from '@/lib/charts/use-cases-time-series-data';

import { CasesTimeSeriesChart } from './cases-time-series-chart';

export function CasesTimeSeriesPanel() {
  const { isGlobal, selectedCountry } = useDashboardSelection();
  const { loadState, viewModel, errorMessage, retry } = useCasesTimeSeriesData(
    isGlobal,
    selectedCountry,
  );

  const showChart =
    loadState === 'success' && viewModel !== null && !viewModel.isEmpty;

  return (
    <section
      aria-label={CHART_TITLE}
      aria-busy={loadState === 'loading'}
      className="space-y-3"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        {CHART_TITLE}
      </h2>

      {loadState === 'loading' ? (
        <LoadingState message="Loading chart data…" variant="panel" />
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {loadState === 'success' && viewModel?.isEmpty ? (
        <p
          role="status"
          className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center text-sm text-zinc-600 sm:min-h-[280px] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          {CHART_EMPTY_MESSAGE}
        </p>
      ) : null}

      {showChart && viewModel ? (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing {viewModel.scopeLabel} · {viewModel.meta.pointCount} data points
            {viewModel.meta.from && viewModel.meta.to
              ? ` · ${viewModel.meta.from} to ${viewModel.meta.to}`
              : ''}
          </p>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <CasesTimeSeriesChart points={viewModel.points} />
          </div>
        </>
      ) : null}
    </section>
  );
}
