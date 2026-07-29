import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import {
  buildCoverageBannerDisplay,
  formatCoverageBannerMessage,
  resolveMapCountryCount,
} from '../format-coverage-banner';
import { loadSyncReferenceLabel } from '../load-sync-reference-label';

vi.mock('@/lib/api/client', () => ({
  getSyncStatus: vi.fn(),
}));

vi.mock('@/lib/sync/format-sync-status', () => ({
  formatLatestReferenceDate: vi.fn((value: string | null) =>
    value === '2023-03-09' ? 'Mar 9, 2023' : null,
  ),
}));

import { getSyncStatus } from '@/lib/api/client';

describe('formatCoverageBannerMessage', () => {
  it('formats typical map and chart coverage with reference date', () => {
    expect(
      formatCoverageBannerMessage({
        mapCountryCount: 196,
        chartReadyCount: 12,
        referenceDateLabel: 'Mar 9, 2023',
      }),
    ).toBe(
      'Map & KPIs: 196 countries · Full daily chart: 12 countries · Reference: Mar 9, 2023',
    );
  });

  it('uses singular labels for count of 1', () => {
    expect(
      formatCoverageBannerMessage({
        mapCountryCount: 1,
        chartReadyCount: 1,
        referenceDateLabel: 'Jan 1, 2023',
      }),
    ).toBe(
      'Map & KPIs: 1 country · Full daily chart: 1 country · Reference: Jan 1, 2023',
    );
  });

  it('shows unavailable reference when label is null or empty', () => {
    expect(
      formatCoverageBannerMessage({
        mapCountryCount: 50,
        chartReadyCount: 12,
        referenceDateLabel: null,
      }),
    ).toBe(
      'Map & KPIs: 50 countries · Full daily chart: 12 countries · Reference: unavailable',
    );

    expect(
      formatCoverageBannerMessage({
        mapCountryCount: 50,
        chartReadyCount: 12,
        referenceDateLabel: '',
      }),
    ).toBe(
      'Map & KPIs: 50 countries · Full daily chart: 12 countries · Reference: unavailable',
    );
  });

  it('normalizes invalid counts to zero', () => {
    expect(
      formatCoverageBannerMessage({
        mapCountryCount: -3,
        chartReadyCount: Number.NaN,
        referenceDateLabel: null,
      }),
    ).toBe(
      'Map & KPIs: 0 countries · Full daily chart: 0 countries · Reference: unavailable',
    );
  });

  it('strips HTML-like content from reference date labels', () => {
    const display = buildCoverageBannerDisplay({
      mapCountryCount: 10,
      chartReadyCount: 12,
      referenceDateLabel: '<img src=x onerror=alert(1)>Mar 9, 2023',
    });

    expect(display.referenceDateLabel).toBe('Mar 9, 2023');
    expect(display.referenceUnavailable).toBe(false);
  });
});

const emptyMetrics = {
  casesTotal: null,
  deathsTotal: null,
  casesNew: null,
} as const;

describe('resolveMapCountryCount', () => {
  it('prefers meta.count when present', () => {
    expect(
      resolveMapCountryCount({
        referenceDate: '2023-03-09',
        countries: [{ code: 'BR', name: 'Brazil', metrics: emptyMetrics }],
        meta: { count: 196, lastSuccessfulSyncAt: null },
      }),
    ).toBe(196);
  });

  it('falls back to countries.length when meta.count is invalid', () => {
    expect(
      resolveMapCountryCount({
        referenceDate: '2023-03-09',
        countries: [
          { code: 'BR', name: 'Brazil', metrics: emptyMetrics },
          { code: 'US', name: 'United States', metrics: emptyMetrics },
        ],
        meta: { count: Number.NaN, lastSuccessfulSyncAt: null },
      }),
    ).toBe(2);
  });

  it('throws when payload has no usable count', () => {
    expect(() =>
      resolveMapCountryCount({
        referenceDate: '2023-03-09',
        countries: null as unknown as [],
        meta: { count: Number.NaN, lastSuccessfulSyncAt: null },
      }),
    ).toThrow('Invalid countries payload');
  });
});

describe('loadSyncReferenceLabel', () => {
  it('returns formatted label on success', async () => {
    vi.mocked(getSyncStatus).mockResolvedValueOnce({
      dataSource: 'API Ninjas',
      lastSuccessfulSyncAt: null,
      lastSyncStatus: 'success',
      latestReferenceDate: '2023-03-09',
    });

    await expect(
      loadSyncReferenceLabel(new AbortController().signal),
    ).resolves.toBe('Mar 9, 2023');
  });

  it('returns null on non-abort failures', async () => {
    vi.mocked(getSyncStatus).mockRejectedValueOnce(ApiError.network());

    await expect(
      loadSyncReferenceLabel(new AbortController().signal),
    ).resolves.toBeNull();
  });

  it('rethrows abort errors', async () => {
    vi.mocked(getSyncStatus).mockRejectedValueOnce(ApiError.aborted());

    await expect(
      loadSyncReferenceLabel(new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'abort' });
  });
});
