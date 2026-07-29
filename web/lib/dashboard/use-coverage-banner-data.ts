'use client';

/**
 * Loads country list count + sync reference date for the coverage banner (Sprint 04).
 *
 * Country count is required for the banner; sync status is best-effort for reference date.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCountries, getSyncStatus } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { formatLatestReferenceDate } from '@/lib/sync/format-sync-status';
import { toFetchErrorMessage } from '@/lib/ui/fetch-error-message';

import { CHART_READY_COUNTRY_COUNT } from './constants';
import { formatCoverageBannerMessage } from './format-coverage-banner';

export type CoverageBannerLoadState = 'loading' | 'success' | 'error';

export type UseCoverageBannerDataResult = {
  loadState: CoverageBannerLoadState;
  message: string | null;
  errorMessage: string | null;
  retry: () => void;
};

export function useCoverageBannerData(): UseCoverageBannerDataResult {
  const [loadState, setLoadState] = useState<CoverageBannerLoadState>('loading');
  const [mapCountryCount, setMapCountryCount] = useState<number | null>(null);
  const [referenceDateLabel, setReferenceDateLabel] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadCoverageData() {
      setLoadState('loading');
      setErrorMessage(null);
      setMapCountryCount(null);
      setReferenceDateLabel(null);

      try {
        const [countriesResponse, syncStatus] = await Promise.all([
          getCountries({}, { signal: controller.signal }),
          getSyncStatus({ signal: controller.signal }).catch(() => null),
        ]);

        if (ignoreResult) {
          return;
        }

        const referenceLabel =
          syncStatus !== null
            ? formatLatestReferenceDate(syncStatus.latestReferenceDate)
            : null;

        setMapCountryCount(countriesResponse.countries.length);
        setReferenceDateLabel(referenceLabel);
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setMapCountryCount(null);
        setReferenceDateLabel(null);
        setErrorMessage(
          toFetchErrorMessage(
            error,
            'Coverage data unavailable. Please try again.',
          ),
        );
        setLoadState('error');
      }
    }

    void loadCoverageData();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [retryCount]);

  const message = useMemo(() => {
    if (loadState !== 'success' || mapCountryCount === null) {
      return null;
    }

    return formatCoverageBannerMessage({
      mapCountryCount,
      chartReadyCount: CHART_READY_COUNTRY_COUNT,
      referenceDateLabel,
    });
  }, [loadState, mapCountryCount, referenceDateLabel]);

  return { loadState, message, errorMessage, retry };
}
