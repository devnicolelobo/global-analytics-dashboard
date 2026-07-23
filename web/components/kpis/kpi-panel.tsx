'use client';

/**
 * KPI panel container (DEV-91).
 * Data loading lives in useKpiPanelData; this component renders loading, error,
 * empty, and success states with accessible English copy (REQ-F-51, REQ-F-53).
 */
import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import { useKpiPanelData } from '@/lib/kpis/use-kpi-panel-data';

import { KpiCard } from './kpi-card';

export function KpiPanel() {
  const { isGlobal, selectedCountry } = useDashboardSelection();
  const { loadState, viewModel, errorMessage } = useKpiPanelData(
    isGlobal,
    selectedCountry,
  );

  const showCards =
    loadState === 'success' && viewModel !== null && !viewModel.isEmpty;

  return (
    <div className="space-y-3" aria-busy={loadState === 'loading'}>
      {loadState === 'loading' ? (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          Loading KPI data…
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
          className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          No KPI data available yet for {viewModel.scopeLabel}. Run a sync on the
          API or try again later.
        </p>
      ) : null}

      {showCards ? (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing metrics for {viewModel.scopeLabel}
            {viewModel.referenceDate
              ? ` · Reference date: ${viewModel.referenceDate}`
              : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {viewModel.cards.map((card) => (
              <KpiCard key={card.id} card={card} />
            ))}
          </div>
        </>
      ) : null}

      {loadState === 'idle' ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Preparing KPI panel…
        </p>
      ) : null}
    </div>
  );
}
