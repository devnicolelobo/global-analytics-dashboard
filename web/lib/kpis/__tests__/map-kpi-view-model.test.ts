import { describe, expect, it } from 'vitest';

import type {
  CountryDetailResponse,
  SummaryResponse,
} from '@/lib/api/types';

import {
  KPI_METRIC_DEFINITIONS,
  mapCountryDetailToKpiPanel,
  mapSummaryToKpiPanel,
  toKpiPanelErrorMessage,
} from '../map-kpi-view-model';

describe('mapSummaryToKpiPanel', () => {
  it('maps global summary metrics to three KPI cards', () => {
    const response: SummaryResponse = {
      scope: 'global',
      referenceDate: '2024-06-15',
      metrics: {
        casesTotal: 1_234_567,
        deathsTotal: 98_765,
        casesNew: 1_200,
      },
      meta: {
        lastSuccessfulSyncAt: '2024-06-16T10:00:00.000Z',
        dataSource: 'api-ninjas',
      },
    };

    const viewModel = mapSummaryToKpiPanel(response);

    expect(viewModel.scopeLabel).toBe('Global');
    expect(viewModel.referenceDate).toBe('2024-06-15');
    expect(viewModel.isEmpty).toBe(false);
    expect(viewModel.cards).toHaveLength(3);
    expect(viewModel.cards[0]).toMatchObject({
      id: 'casesTotal',
      label: 'Confirmed cases',
      value: '1,234,567',
      subtitle: 'Reference date: 2024-06-15',
    });
    expect(viewModel.cards[2].label).toBe('New cases (daily)');
  });

  it('marks panel empty when all metrics are null', () => {
    const response: SummaryResponse = {
      scope: 'global',
      referenceDate: '2024-06-15',
      metrics: {
        casesTotal: null,
        deathsTotal: null,
        casesNew: null,
      },
      meta: {
        lastSuccessfulSyncAt: null,
        dataSource: 'api-ninjas',
      },
    };

    const viewModel = mapSummaryToKpiPanel(response);

    expect(viewModel.isEmpty).toBe(true);
    expect(viewModel.cards.every((card) => card.value === '—')).toBe(true);
  });
});

describe('mapCountryDetailToKpiPanel', () => {
  it('uses country name for scope label and maps metrics', () => {
    const response: CountryDetailResponse = {
      scope: 'country',
      country: { code: 'BR', name: 'Brazil' },
      referenceDate: '2024-06-10',
      metrics: {
        casesTotal: 50_000,
        deathsTotal: 1_000,
        casesNew: 42,
        deathsNew: 3,
      },
      meta: {
        hasRegionalBreakdown: false,
        lastSuccessfulSyncAt: null,
      },
    };

    const viewModel = mapCountryDetailToKpiPanel(response);

    expect(viewModel.scopeLabel).toBe('Brazil');
    expect(viewModel.cards[0].value).toBe('50,000');
    expect(viewModel.cards[2].id).toBe('casesNew');
  });

  it('falls back to country code when name is blank', () => {
    const response: CountryDetailResponse = {
      scope: 'country',
      country: { code: 'US', name: '   ' },
      referenceDate: '2024-06-10',
      metrics: {
        casesTotal: 100,
        deathsTotal: 1,
        casesNew: null,
      },
      meta: {
        hasRegionalBreakdown: false,
        lastSuccessfulSyncAt: null,
      },
    };

    expect(mapCountryDetailToKpiPanel(response).scopeLabel).toBe('US');
  });
});

describe('KPI_METRIC_DEFINITIONS', () => {
  it('documents G-01 fallback as new cases, not active cases', () => {
    expect(KPI_METRIC_DEFINITIONS[2]).toEqual({
      id: 'casesNew',
      label: 'New cases (daily)',
    });
  });
});

describe('toKpiPanelErrorMessage', () => {
  it('returns Error message when present', () => {
    expect(toKpiPanelErrorMessage(new Error('Service unavailable'))).toBe(
      'Service unavailable',
    );
  });

  it('returns generic fallback for unknown errors', () => {
    expect(toKpiPanelErrorMessage('boom')).toBe(
      'Unable to load KPI data. Please try again later.',
    );
  });
});
