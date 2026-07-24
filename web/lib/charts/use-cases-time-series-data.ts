'use client';

/**
 * Fetches confirmed-cases time series for dashboard selection (DEV-93).
 *
 * Global scope → GET /covid/series?metric=casesTotal (API_SPEC §6.6).
 * Country scope → GET /covid/countries/:code/series?metric=casesTotal (§6.5).
 * AbortController + stale guard mirror useKpiPanelData / useMapCountriesData.
 */
import { useEffect, useState } from 'react';

import { getGlobalSeries, getSeries } from '@/lib/api/client';
import { ApiError, sanitizeErrorMessage } from '@/lib/api/errors';

import { CHART_METRIC } from './constants';
import {
  mapCountrySeriesToChart,
  mapGlobalSeriesToChart,
  resolveSeriesFetchTarget,
} from './map-series-data';
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
  const [loadState, setLoadState] = useState<ChartLoadState>('idle');
  const [viewModel, setViewModel] = useState<ChartSeriesViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadSeries() {
      setLoadState('loading');
      setErrorMessage(null);
      setViewModel(null);

      const target = resolveSeriesFetchTarget(isGlobal, selectedCountry);
      if (target === null) {
        setErrorMessage('Invalid country selection.');
        setLoadState('error');
        return;
      }

      try {
        const requestOptions = {
          metric: CHART_METRIC,
        } as const;
        const signal = controller.signal;

        const mapped =
          target.kind === 'global'
            ? mapGlobalSeriesToChart(
                await getGlobalSeries(requestOptions, { signal }),
              )
            : mapCountrySeriesToChart(
                await getSeries(target.countryCode, requestOptions, { signal }),
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
