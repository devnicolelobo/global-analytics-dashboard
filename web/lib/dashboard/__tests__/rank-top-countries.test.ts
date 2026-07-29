import { describe, expect, it } from 'vitest';

import type { CountryListItem } from '@/lib/api/types';

import {
  formatTopCountriesHeading,
  rankTopCountries,
} from '../rank-top-countries';

const emptyMetrics = {
  casesTotal: null,
  deathsTotal: null,
  casesNew: null,
} as const;

function country(
  code: string,
  name: string,
  metrics: Partial<CountryListItem['metrics']>,
): CountryListItem {
  return {
    code,
    name,
    metrics: { ...emptyMetrics, ...metrics },
  };
}

describe('rankTopCountries', () => {
  const fixture: CountryListItem[] = [
    country('US', 'United States', {
      casesTotal: 103_000_000,
      deathsTotal: 1_100_000,
      casesNew: 5000,
    }),
    country('IN', 'India', {
      casesTotal: 45_000_000,
      deathsTotal: 533_000,
      casesNew: 100,
    }),
    country('BR', 'Brazil', {
      casesTotal: 37_000_000,
      deathsTotal: 700_000,
      casesNew: 200,
    }),
    country('br', 'Invalid lowercase code', {
      casesTotal: 999_999_999,
    }),
    country('XX', 'No metric', { casesTotal: null }),
    country('DE', 'Germany', {
      casesTotal: 38_000_000,
      deathsTotal: 170_000,
      casesNew: 50,
    }),
  ];

  it('returns top N by casesTotal descending with null metrics last', () => {
    expect(rankTopCountries(fixture, 'casesTotal', 3)).toEqual([
      {
        rank: 1,
        code: 'US',
        name: 'United States',
        metricValue: 103_000_000,
      },
      {
        rank: 2,
        code: 'IN',
        name: 'India',
        metricValue: 45_000_000,
      },
      {
        rank: 3,
        code: 'DE',
        name: 'Germany',
        metricValue: 38_000_000,
      },
    ]);
  });

  it('re-ranks when metric changes', () => {
    const byDeaths = rankTopCountries(fixture, 'deathsTotal', 2);
    expect(byDeaths[0]?.code).toBe('US');
    expect(byDeaths[1]?.code).toBe('BR');
  });

  it('breaks ties by country name A→Z', () => {
    const tied: CountryListItem[] = [
      country('BR', 'Brazil', { casesTotal: 100 }),
      country('AR', 'Argentina', { casesTotal: 100 }),
    ];

    expect(rankTopCountries(tied, 'casesTotal', 10).map((row) => row.code)).toEqual(
      ['AR', 'BR'],
    );
  });

  it('excludes invalid ISO2 codes', () => {
    expect(
      rankTopCountries(fixture, 'casesTotal', 10).some((row) => row.code === 'br'),
    ).toBe(false);
  });

  it('returns fewer rows when list is smaller than limit', () => {
    expect(rankTopCountries([fixture[0]!], 'casesTotal', 10)).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(rankTopCountries([], 'casesTotal')).toEqual([]);
  });

  it('strips HTML-like content from country names', () => {
    const rows = rankTopCountries(
      [country('US', '<b>United States</b>', { casesTotal: 1 })],
      'casesTotal',
      1,
    );
    expect(rows[0]?.name).toBe('United States');
  });
});

describe('formatTopCountriesHeading', () => {
  it('uses Top N when fewer than limit countries rank', () => {
    expect(formatTopCountriesHeading(7)).toBe('Top 7 countries');
  });

  it('uses Top 10 when at limit', () => {
    expect(formatTopCountriesHeading(10)).toBe('Top 10 countries');
  });

  it('handles singular and empty states', () => {
    expect(formatTopCountriesHeading(1)).toBe('Top country');
    expect(formatTopCountriesHeading(0)).toBe('Top countries');
  });
});
