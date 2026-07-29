'use client';

/**
 * Loads and ranks countries for the top-countries panel (Sprint 04 / DEV-98).
 *
 * Uses GET /covid/countries?metric=… for server-side sort hint; client re-ranks for
 * null handling, tie-breaking, and ISO2 validation.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCountries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { formatReferenceDateSubtitle } from '@/lib/kpis/format-metric';
import { toFetchErrorMessage } from '@/lib/ui/fetch-error-message';

import { rankTopCountries, type RankedCountryRow } from './rank-top-countries';
import {
  DEFAULT_TOP_COUNTRIES_METRIC,
  TOP_COUNTRIES_LIMIT,
  type TopCountriesMetric,
} from './top-countries-metrics';

export type TopCountriesPanelLoadState = 'loading' | 'success' | 'error';

export type UseTopCountriesPanelDataResult = {
  loadState: TopCountriesPanelLoadState;
  rows: RankedCountryRow[];
  referenceDateSubtitle: string | undefined;
  errorMessage: string | null;
  retry: () => void;
};

export function useTopCountriesPanelData(
  metric: TopCountriesMetric = DEFAULT_TOP_COUNTRIES_METRIC,
): UseTopCountriesPanelDataResult {
  const [loadState, setLoadState] =
    useState<TopCountriesPanelLoadState>('loading');
  const [rows, setRows] = useState<RankedCountryRow[]>([]);
  const [referenceDateSubtitle, setReferenceDateSubtitle] = useState<
    string | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadTopCountries() {
      setLoadState('loading');
      setErrorMessage(null);
      setRows([]);
      setReferenceDateSubtitle(undefined);

      try {
        const response = await getCountries(
          { metric },
          { signal: controller.signal },
        );

        if (ignoreResult) {
          return;
        }

        const ranked = rankTopCountries(
          response.countries,
          metric,
          TOP_COUNTRIES_LIMIT,
        );

        setRows(ranked);
        setReferenceDateSubtitle(
          formatReferenceDateSubtitle(response.referenceDate),
        );
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setRows([]);
        setReferenceDateSubtitle(undefined);
        setErrorMessage(
          toFetchErrorMessage(
            error,
            'Unable to load top countries. Please try again.',
          ),
        );
        setLoadState('error');
      }
    }

    void loadTopCountries();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [metric, retryCount]);

  return useMemo(
    () => ({
      loadState,
      rows,
      referenceDateSubtitle,
      errorMessage,
      retry,
    }),
    [loadState, rows, referenceDateSubtitle, errorMessage, retry],
  );
}
