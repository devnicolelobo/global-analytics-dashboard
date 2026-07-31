'use client';

/**
 * Loads and filters countries for the Country Explorer panel (Sprint 04 / DEV-99).
 *
 * Uses GET /covid/countries once per mount; client filters ~196 rows by search query.
 * Duplicate fetch trade-off documented in web/lib/dashboard/README.md.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCountries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { CountryListItem } from '@/lib/api/types';
import { formatReferenceDateSubtitle } from '@/lib/kpis/format-metric';
import { toFetchErrorMessage } from '@/lib/ui/fetch-error-message';

import { filterCountriesByQuery } from './filter-countries-by-query';
import {
  mapExplorerCountryRows,
  sortExplorerCountryRowsByName,
  type ExplorerCountryRow,
} from './map-explorer-country-rows';

export const COUNTRY_EXPLORER_SEARCH_DEBOUNCE_MS = 280;

export type CountryExplorerLoadState = 'loading' | 'success' | 'error';

export type UseCountryExplorerDataResult = {
  loadState: CountryExplorerLoadState;
  isRefreshing: boolean;
  rows: ExplorerCountryRow[];
  totalCount: number;
  visibleCount: number;
  debouncedQuery: string;
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

export function useCountryExplorerData(
  searchQuery: string,
): UseCountryExplorerDataResult {
  const hasLoadedOnceRef = useRef(false);
  const [loadState, setLoadState] =
    useState<CountryExplorerLoadState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allRows, setAllRows] = useState<ExplorerCountryRow[]>([]);
  const [referenceDateSubtitle, setReferenceDateSubtitle] = useState<
    string | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, COUNTRY_EXPLORER_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;
    const hadData = hasLoadedOnceRef.current;

    async function loadCountries() {
      setErrorMessage(null);
      setIsRefreshing(hadData);
      if (!hadData) {
        setLoadState('loading');
      }

      try {
        const response = await getCountries({}, { signal: controller.signal });

        if (ignoreResult) {
          return;
        }

        const mapped = sortExplorerCountryRowsByName(
          mapExplorerCountryRows(resolveCountriesList(response.countries)),
        );

        setAllRows(mapped);
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
          setAllRows([]);
          setReferenceDateSubtitle(undefined);
          setErrorMessage(
            toFetchErrorMessage(
              error,
              'Unable to load countries. Please try again.',
            ),
          );
          setLoadState('error');
          return;
        }

        setErrorMessage(
          toFetchErrorMessage(
            error,
            'Unable to refresh countries. Showing previous data.',
          ),
        );
      }
    }

    void loadCountries();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [retryCount]);

  const rows = useMemo(() => {
    return filterCountriesByQuery(allRows, debouncedQuery);
  }, [allRows, debouncedQuery]);

  return useMemo(
    () => ({
      loadState,
      isRefreshing,
      rows,
      totalCount: allRows.length,
      visibleCount: rows.length,
      debouncedQuery,
      referenceDateSubtitle,
      errorMessage,
      retry,
    }),
    [
      loadState,
      isRefreshing,
      rows,
      allRows.length,
      debouncedQuery,
      referenceDateSubtitle,
      errorMessage,
      retry,
    ],
  );
}
