'use client';

/**
 * Confirmed cases chart section — data loading + states (DEV-93).
 *
 * Wires DEV-90 selection to useCasesTimeSeriesData; chart SVG lives in CasesTimeSeriesChart.
 */
import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import {
  CHART_EMPTY_MESSAGE,
  CHART_TITLE,
} from '@/lib/charts/constants';
import { useCasesTimeSeriesData } from '@/lib/charts/use-cases-time-series-data';

import { CasesTimeSeriesChart } from './cases-time-series-chart';

export function CasesTimeSeriesPanel() {
  const { isGlobal, selectedCountry } = useDashboardSelection();
  const { loadState, viewModel, errorMessage } = useCasesTimeSeriesData(
    isGlobal,
    selectedCountry,
  );

  const showChart =
    loadState === 'success' &&
    viewModel !== null &&
    !viewModel.isEmpty &&
    viewModel.points.length > 0;

  return (
    <section aria-label={CHART_TITLE} className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        {CHART_TITLE}
      </h2>

      {loadState === 'loading' ? (
        <p
          role="status"
          aria-live="polite"
          className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-600 sm:min-h-[280px] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          Loading chart data…
        </p>
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMessage}
        </p>
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

      {loadState === 'idle' ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Preparing chart…</p>
      ) : null}
    </section>
  );
}
