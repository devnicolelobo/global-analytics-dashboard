import { describe, expect, it } from 'vitest';

import { formatCoverageBannerMessage } from '../format-coverage-banner';

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
});
