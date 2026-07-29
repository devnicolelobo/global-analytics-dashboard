'use client';

/**
 * Loads and ranks countries for the top-countries panel (Sprint 04 / DEV-98).
 *
 * Uses GET /covid/countries?metric=… for server-side sort hint; client re-ranks for
 * null handling, tie-breaking, and ISO2 validation.
 *
 * Note: duplicate GET /covid/countries with map and coverage banner — MVP trade-off
 * documented in web/lib/dashboard/README.md.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCountries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { CountryListItem } from '@/lib/api/types';
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
  /** True while re-fetching after metric change or retry — prior rows stay visible. */
  isRefreshing: boolean;
  rows: RankedCountryRow[];
  referenceDateSubtitle: string | undefined;
  errorMessage: string | null;
  retry: () => void;
};

function resolveCountriesList(countries: unknown): CountryListItem[] {
  if (!Array.isArray(countries)) {
    throw new Error('Invalid countries payload');
  }
  return countries;
}

export function useTopCountriesPanelData(
  metric: TopCountriesMetric = DEFAULT_TOP_COUNTRIES_METRIC,
): UseTopCountriesPanelDataResult {
  const hasLoadedOnceRef = useRef(false);
  const [loadState, setLoadState] =
    useState<TopCountriesPanelLoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    const hadData = hasLoadedOnceRef.current;

    async function loadTopCountries() {
      setErrorMessage(null);
      setIsRefreshing(hadData);
      if (!hadData) {
        setLoadState('loading');
      }

      try {
        const response = await getCountries(
          { metric },
          { signal: controller.signal },
        );

        if (ignoreResult) {
          return;
        }

        const ranked = rankTopCountries(
          resolveCountriesList(response.countries),
          metric,
          TOP_COUNTRIES_LIMIT,
        );

        setRows(ranked);
        setReferenceDateSubtitle(
          formatReferenceDateSubtitle(response.referenceDate),
        );
        hasLoadedOnceRef.current = true;
        setLoadState('success');
        setIsRefreshing(false);
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setIsRefreshing(false);

        if (!hasLoadedOnceRef.current) {
          setRows([]);
          setReferenceDateSubtitle(undefined);
          setErrorMessage(
            toFetchErrorMessage(
              error,
              'Unable to load top countries. Please try again.',
            ),
          );
          setLoadState('error');
          return;
        }

        setErrorMessage(
          toFetchErrorMessage(
            error,
            'Unable to refresh rankings. Showing previous data.',
          ),
        );
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
      isRefreshing,
      rows,
      referenceDateSubtitle,
      errorMessage,
      retry,
    }),
    [loadState, isRefreshing, rows, referenceDateSubtitle, errorMessage, retry],
  );
}
