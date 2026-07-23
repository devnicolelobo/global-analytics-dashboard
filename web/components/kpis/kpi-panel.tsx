'use client';

/**
 * KPI panel — Client Component fetch boundary (DEV-91).
 *
 * Reads selection from DEV-90 context and fetches via DEV-89 typed client.
 * Server layout stays server-rendered; only this subtree holds fetch state.
 * AbortController cancels in-flight requests on selection change/unmount (race safety).
 */
import { useEffect, useState } from 'react';

import { getCountry, getSummary } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import {
  mapCountryDetailToKpiPanel,
  mapSummaryToKpiPanel,
  toKpiPanelErrorMessage,
  type KpiPanelViewModel,
} from '@/lib/kpis/map-kpi-view-model';

import { KpiCard } from './kpi-card';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export function KpiPanel() {
  const { selectedCountry, isGlobal } = useDashboardSelection();
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [viewModel, setViewModel] = useState<KpiPanelViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadKpis() {
      setLoadState('loading');
      setErrorMessage(null);

      try {
        if (isGlobal) {
          const data = await getSummary({ signal: controller.signal });
          if (ignoreResult) {
            return;
          }
          setViewModel(mapSummaryToKpiPanel(data));
        } else {
          const data = await getCountry(selectedCountry!, {
            signal: controller.signal,
          });
          if (ignoreResult) {
            return;
          }
          setViewModel(mapCountryDetailToKpiPanel(data));
        }
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setViewModel(null);
        setErrorMessage(toKpiPanelErrorMessage(error));
        setLoadState('error');
      }
    }

    void loadKpis();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [isGlobal, selectedCountry]);

  return (
    <div className="space-y-3">
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No KPI data available yet for {viewModel.scopeLabel}. Run a sync on the
          API or try again later.
        </p>
      ) : null}

      {loadState === 'success' && viewModel ? (
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
