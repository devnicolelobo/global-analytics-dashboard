'use client';

/**
 * Fetches confirmed-cases time series for dashboard selection (DEV-93).
 *
 * Global scope → GET /covid/series?metric=casesTotal (API_SPEC §6.6).
 * Country scope → GET /covid/countries/:code/series?metric=casesTotal (§6.5).
 * AbortController + stale guard mirror useKpiPanelData / useMapCountriesData.
 */
import { useEffect, useState } from 'react';

import { ApiError, sanitizeErrorMessage } from '@/lib/api/errors';

import { loadCasesTimeSeriesViewModel } from './load-cases-time-series';
import type { ChartSeriesViewModel } from './types';

export type ChartLoadState = 'idle' | 'loading' | 'success' | 'error';

export type UseCasesTimeSeriesDataResult = {
  loadState: ChartLoadState;
  viewModel: ChartSeriesViewModel | null;
  errorMessage: string | null;
};

function toChartErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return 'Unable to load chart data. Please try again later.';
}

export function useCasesTimeSeriesData(
  isGlobal: boolean,
  selectedCountry: string | null,
): UseCasesTimeSeriesDataResult {
  const [loadState, setLoadState] = useState<ChartLoadState>('loading');
  const [viewModel, setViewModel] = useState<ChartSeriesViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadSeries() {
      setLoadState('loading');
      setErrorMessage(null);
      setViewModel(null);

      try {
        const mapped = await loadCasesTimeSeriesViewModel(
          isGlobal,
          selectedCountry,
          controller.signal,
        );

        if (ignoreResult) {
          return;
        }

        setViewModel(mapped);
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setViewModel(null);
        setErrorMessage(toChartErrorMessage(error));
        setLoadState('error');
      }
    }

    void loadSeries();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [isGlobal, selectedCountry]);

  return { loadState, viewModel, errorMessage };
}
