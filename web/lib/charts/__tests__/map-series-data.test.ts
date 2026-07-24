import { describe, expect, it } from 'vitest';

import type { CountrySeriesResponse, GlobalSeriesResponse } from '@/lib/api/types';

import {
  computeXAxisTickInterval,
  isEmptySeries,
  mapCountrySeriesToChart,
  mapGlobalSeriesToChart,
  mapPointsToChartData,
  resolveSeriesFetchTarget,
  sortSeriesPointsByDate,
} from '../map-series-data';

describe('sortSeriesPointsByDate', () => {
  it('sorts ascending by ISO date', () => {
    expect(
      sortSeriesPointsByDate([
        { date: '2023-03-09', value: 3 },
        { date: '2023-01-01', value: 1 },
        { date: '2023-02-01', value: 2 },
      ]).map((point) => point.date),
    ).toEqual(['2023-01-01', '2023-02-01', '2023-03-09']);
  });
});

describe('mapPointsToChartData', () => {
  it('preserves null values for line gaps', () => {
    expect(
      mapPointsToChartData([{ date: '2023-03-09', value: null }]),
    ).toEqual([{ date: '2023-03-09', value: null }]);
  });
});

describe('mapGlobalSeriesToChart', () => {
  it('maps API points to chart view model', () => {
    const response: GlobalSeriesResponse = {
      scope: 'global',
      metric: 'casesTotal',
      points: [
        { date: '2023-03-08', value: 100 },
        { date: '2023-03-09', value: 200 },
      ],
      meta: { pointCount: 2, from: '2023-03-08', to: '2023-03-09' },
    };

    const viewModel = mapGlobalSeriesToChart(response);

    expect(viewModel.scopeLabel).toBe('Global');
    expect(viewModel.isEmpty).toBe(false);
    expect(viewModel.points).toHaveLength(2);
    expect(viewModel.points[0]?.value).toBe(100);
  });

  it('marks empty series when points array is empty (REQ-F-42)', () => {
    const response: GlobalSeriesResponse = {
      scope: 'global',
      metric: 'casesTotal',
      points: [],
      meta: { pointCount: 0, from: null, to: null },
    };

    const viewModel = mapGlobalSeriesToChart(response);

    expect(viewModel.isEmpty).toBe(true);
    expect(isEmptySeries(viewModel.points)).toBe(true);
  });
});

describe('mapCountrySeriesToChart', () => {
  it('uses sanitized country name as scope label', () => {
    const response: CountrySeriesResponse = {
      scope: 'country',
      country: { code: 'BR', name: 'Brazil' },
      metric: 'casesTotal',
      points: [{ date: '2023-03-09', value: 37076053 }],
      meta: { pointCount: 1, from: '2023-03-09', to: '2023-03-09' },
    };

    expect(mapCountrySeriesToChart(response).scopeLabel).toBe('Brazil');
  });
});

describe('resolveSeriesFetchTarget', () => {
  it('selects global endpoint when selection is global', () => {
    expect(resolveSeriesFetchTarget(true, null)).toEqual({ kind: 'global' });
  });

  it('selects country endpoint when ISO2 is selected', () => {
    expect(resolveSeriesFetchTarget(false, 'BR')).toEqual({
      kind: 'country',
      countryCode: 'BR',
    });
  });

  it('returns null for invalid country selection', () => {
    expect(resolveSeriesFetchTarget(false, 'invalid')).toBeNull();
  });
});

describe('computeXAxisTickInterval', () => {
  it('thins ticks for dense series', () => {
    expect(computeXAxisTickInterval(6)).toBe(0);
    expect(computeXAxisTickInterval(100)).toBe('preserveStartEnd');
  });
});
