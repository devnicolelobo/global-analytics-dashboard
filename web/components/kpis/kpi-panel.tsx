'use client';

/**
 * KPI panel container (DEV-91 / DEV-94).
 * Data loading lives in useKpiPanelData; shared LoadingState / ErrorState (REQ-F-51).
 */
import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useKpiPanelData } from '@/lib/kpis/use-kpi-panel-data';

import { KpiCard } from './kpi-card';

export function KpiPanel() {
  const { isGlobal, selectedCountry } = useDashboardSelection();
  const { loadState, viewModel, errorMessage, retry } = useKpiPanelData(
    isGlobal,
    selectedCountry,
  );

  const showCards =
    loadState === 'success' && viewModel !== null && !viewModel.isEmpty;

  return (
    <div className="space-y-3" aria-busy={loadState === 'loading'}>
      {loadState === 'loading' ? (
        <LoadingState message="Loading KPIs…" />
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <ErrorState message={errorMessage} onRetry={retry} />
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
    </div>
  );
}
