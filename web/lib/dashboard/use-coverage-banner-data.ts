'use client';

/**
 * Loads country list count + sync reference date for the coverage banner (Sprint 04).
 *
 * Country count is required for the banner; sync status is best-effort for reference date.
 *
 * Note: duplicates GET /covid/countries and GET /sync/status already fetched by map
 * and footer — acceptable for Sprint 04 MVP; consolidate via shared providers in a
 * later card if profiling shows measurable cost.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCountries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { toFetchErrorMessage } from '@/lib/ui/fetch-error-message';

import { CHART_READY_COUNTRY_COUNT } from './constants';
import {
  buildCoverageBannerDisplay,
  formatCoverageBannerMessage,
  resolveMapCountryCount,
} from './format-coverage-banner';
import { loadSyncReferenceLabel } from './load-sync-reference-label';

export type CoverageBannerLoadState = 'loading' | 'success' | 'error';

export type CoverageBannerDisplay = ReturnType<typeof buildCoverageBannerDisplay>;

export type UseCoverageBannerDataResult = {
  loadState: CoverageBannerLoadState;
  display: CoverageBannerDisplay | null;
  /** Full plain-text line for aria-label / screen readers. */
  message: string | null;
  errorMessage: string | null;
  retry: () => void;
};

export function useCoverageBannerData(): UseCoverageBannerDataResult {
  const [loadState, setLoadState] = useState<CoverageBannerLoadState>('loading');
  const [display, setDisplay] = useState<CoverageBannerDisplay | null>(null);
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
      setDisplay(null);

      try {
        const [countriesResponse, referenceDateLabel] = await Promise.all([
          getCountries({}, { signal: controller.signal }),
          loadSyncReferenceLabel(controller.signal),
        ]);

        if (ignoreResult) {
          return;
        }

        const nextDisplay = buildCoverageBannerDisplay({
          mapCountryCount: resolveMapCountryCount(countriesResponse),
          chartReadyCount: CHART_READY_COUNTRY_COUNT,
          referenceDateLabel,
        });

        setDisplay(nextDisplay);
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setDisplay(null);
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
    if (display === null) {
      return null;
    }

    return formatCoverageBannerMessage({
      mapCountryCount: display.mapCountryCount,
      chartReadyCount: display.chartReadyCount,
      referenceDateLabel: display.referenceDateLabel,
    });
  }, [display]);

  return { loadState, display, message, errorMessage, retry };
}
