import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountrySeriesResponse, GlobalSeriesResponse } from '@/lib/api/types';

vi.mock('@/lib/api/client', () => ({
  getGlobalSeries: vi.fn(),
  getSeries: vi.fn(),
}));

import { getGlobalSeries, getSeries } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

import { loadCasesTimeSeriesViewModel } from '../load-cases-time-series';

const globalResponse: GlobalSeriesResponse = {
  scope: 'global',
  metric: 'casesTotal',
  points: [
    { date: '2023-03-08', value: 100 },
    { date: '2023-03-09', value: 200 },
  ],
  meta: { pointCount: 2, from: '2023-03-08', to: '2023-03-09' },
};

const countryResponse: CountrySeriesResponse = {
  scope: 'country',
  country: { code: 'BR', name: 'Brazil' },
  metric: 'casesTotal',
  points: [{ date: '2023-03-09', value: 37076053 }],
  meta: { pointCount: 1, from: '2023-03-09', to: '2023-03-09' },
};

describe('loadCasesTimeSeriesViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getGlobalSeries when selection is global', async () => {
    vi.mocked(getGlobalSeries).mockResolvedValue(globalResponse);
    const signal = new AbortController().signal;

    const viewModel = await loadCasesTimeSeriesViewModel(true, null, signal);

    expect(getGlobalSeries).toHaveBeenCalledWith(
      { metric: 'casesTotal' },
      { signal },
    );
    expect(getSeries).not.toHaveBeenCalled();
    expect(viewModel.scopeLabel).toBe('Global');
    expect(viewModel.isEmpty).toBe(false);
  });

  it('calls getSeries when a country is selected', async () => {
    vi.mocked(getSeries).mockResolvedValue(countryResponse);
    const signal = new AbortController().signal;

    const viewModel = await loadCasesTimeSeriesViewModel(false, 'BR', signal);

    expect(getSeries).toHaveBeenCalledWith(
      'BR',
      { metric: 'casesTotal' },
      { signal },
    );
    expect(getGlobalSeries).not.toHaveBeenCalled();
    expect(viewModel.scopeLabel).toBe('Brazil');
  });

  it('throws ApiError for invalid country selection', async () => {
    await expect(
      loadCasesTimeSeriesViewModel(false, 'invalid', new AbortController().signal),
    ).rejects.toMatchObject({
      message: 'Invalid country selection.',
      kind: 'http',
    });

    expect(getGlobalSeries).not.toHaveBeenCalled();
    expect(getSeries).not.toHaveBeenCalled();
  });

  it('propagates client failures', async () => {
    vi.mocked(getGlobalSeries).mockRejectedValue(ApiError.network());

    await expect(
      loadCasesTimeSeriesViewModel(true, null, new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'network' });
  });
});
