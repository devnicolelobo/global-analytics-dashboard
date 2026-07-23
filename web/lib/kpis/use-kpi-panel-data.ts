'use client';

/**
 * Fetches KPI data for the current dashboard selection (DEV-91).
 *
 * Extracted hook keeps KpiPanel presentational and centralizes:
 * - AbortController lifecycle (selection change / unmount)
 * - stale-response guard via `ignoreResult`
 * - global vs country routing through typed API client only
 */
import { useEffect, useState } from 'react';

import { getCountry, getSummary } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { parseCountryCodeForSelection } from '@/lib/dashboard/selection';
import {
  mapCountryDetailToKpiPanel,
  mapSummaryToKpiPanel,
  toKpiPanelErrorMessage,
  type KpiPanelViewModel,
} from '@/lib/kpis/map-kpi-view-model';

export type KpiPanelLoadState = 'idle' | 'loading' | 'success' | 'error';

export type UseKpiPanelDataResult = {
  loadState: KpiPanelLoadState;
  viewModel: KpiPanelViewModel | null;
  errorMessage: string | null;
};

export function useKpiPanelData(
  isGlobal: boolean,
  selectedCountry: string | null,
): UseKpiPanelDataResult {
  const [loadState, setLoadState] = useState<KpiPanelLoadState>('idle');
  const [viewModel, setViewModel] = useState<KpiPanelViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadKpis() {
      setLoadState('loading');
      setErrorMessage(null);
      setViewModel(null);

      try {
        if (isGlobal) {
          const data = await getSummary({ signal: controller.signal });
          if (ignoreResult) {
            return;
          }
          setViewModel(mapSummaryToKpiPanel(data));
        } else {
          const countryCode = parseCountryCodeForSelection(selectedCountry);
          if (countryCode === null) {
            throw new ApiError('Invalid country selection.', {
              kind: 'http',
              statusCode: 400,
            });
          }

          const data = await getCountry(countryCode, {
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

  return { loadState, viewModel, errorMessage };
}
