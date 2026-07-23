'use client';

/**
 * Fetches country list for the choropleth map (DEV-92).
 *
 * Single GET /covid/countries call on mount — tooltips use list rows (no N+1 hover fetches).
 * AbortController + stale guard mirror useKpiPanelData; metric is fixed for MVP (casesTotal).
 */
import { useEffect, useMemo, useState } from 'react';

import { getCountries } from '@/lib/api/client';
import { ApiError, sanitizeErrorMessage } from '@/lib/api/errors';
import type { CountriesResponse } from '@/lib/api/types';

import { computeMetricExtent, type MetricExtent } from './choropleth-scale';
import { buildCountryListLookup, type CountryListLookup } from './join-metrics';
import { DEFAULT_MAP_METRIC, type MapMetric } from './types';

export type MapCountriesLoadState = 'idle' | 'loading' | 'success' | 'error';

export type UseMapCountriesDataResult = {
  loadState: MapCountriesLoadState;
  response: CountriesResponse | null;
  lookup: CountryListLookup;
  metricExtent: MetricExtent | null;
  errorMessage: string | null;
};

function toMapCountriesErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return 'Unable to load map data. Please try again later.';
}

export function useMapCountriesData(
  metric: MapMetric = DEFAULT_MAP_METRIC,
): UseMapCountriesDataResult {
  const [loadState, setLoadState] = useState<MapCountriesLoadState>('idle');
  const [response, setResponse] = useState<CountriesResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadCountries() {
      setLoadState('loading');
      setErrorMessage(null);
      setResponse(null);

      try {
        const data = await getCountries({ metric }, { signal: controller.signal });
        if (ignoreResult) {
          return;
        }
        setResponse(data);
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setResponse(null);
        setErrorMessage(toMapCountriesErrorMessage(error));
        setLoadState('error');
      }
    }

    void loadCountries();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [metric]);

  const lookup = useMemo(() => {
    if (response === null) {
      return new Map<string, never>();
    }
    return buildCountryListLookup(response.countries);
  }, [response]);

  const metricExtent = useMemo(() => {
    if (response === null) {
      return null;
    }
    return computeMetricExtent(
      response.countries.map((country) => country.metrics[metric] ?? null),
    );
  }, [response, metric]);

  return {
    loadState,
    response,
    lookup,
    metricExtent,
    errorMessage,
  };
}
