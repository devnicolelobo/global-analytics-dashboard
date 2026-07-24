/**
 * Fetches and maps confirmed-cases series for dashboard selection (DEV-93).
 *
 * Pure async loader extracted from the hook so routing, metric, and client calls
 * can be unit-tested without React. AbortSignal is forwarded to the typed client.
 */
import { getGlobalSeries, getSeries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

import { CHART_METRIC } from './constants';
import {
  mapCountrySeriesToChart,
  mapGlobalSeriesToChart,
  resolveSeriesFetchTarget,
} from './map-series-data';
import type { ChartSeriesViewModel } from './types';

export async function loadCasesTimeSeriesViewModel(
  isGlobal: boolean,
  selectedCountry: string | null,
  signal: AbortSignal,
): Promise<ChartSeriesViewModel> {
  const target = resolveSeriesFetchTarget(isGlobal, selectedCountry);
  if (target === null) {
    throw new ApiError('Invalid country selection.', {
      kind: 'http',
      statusCode: 400,
    });
  }

  const requestOptions = {
    metric: CHART_METRIC,
  } as const;

  if (target.kind === 'global') {
    return mapGlobalSeriesToChart(
      await getGlobalSeries(requestOptions, { signal }),
    );
  }

  return mapCountrySeriesToChart(
    await getSeries(target.countryCode, requestOptions, { signal }),
  );
}
