import { describe, expect, it } from 'vitest';

import type { CountryListItem } from '@/lib/api/types';

import {
  mapExplorerCountryRows,
  sortExplorerCountryRowsByName,
} from '../map-explorer-country-rows';

function country(
  code: string,
  name: string,
  metrics: Partial<CountryListItem['metrics']> = {},
): CountryListItem {
  return {
    code,
    name,
    metrics: {
      casesTotal: null,
      deathsTotal: null,
      casesNew: null,
      ...metrics,
    },
  };
}

describe('mapExplorerCountryRows', () => {
  it('returns empty array for invalid input', () => {
    expect(mapExplorerCountryRows([])).toEqual([]);
    expect(mapExplorerCountryRows(null as unknown as CountryListItem[])).toEqual(
      [],
    );
  });

  it('drops invalid codes and sanitizes names', () => {
    expect(
      mapExplorerCountryRows([
        country('BR', 'Brazil', { casesTotal: 1 }),
        country('BRA', 'Invalid'),
        country('US', '<b>United States</b>', { casesTotal: 2 }),
        country('XX', ''),
      ]),
    ).toEqual([
      {
        code: 'BR',
        name: 'Brazil',
        metrics: {
          casesTotal: 1,
          deathsTotal: null,
          casesNew: null,
        },
      },
      {
        code: 'US',
        name: 'United States',
        metrics: {
          casesTotal: 2,
          deathsTotal: null,
          casesNew: null,
        },
      },
    ]);
  });

  it('deduplicates by ISO2 keeping first occurrence', () => {
    expect(
      mapExplorerCountryRows([
        country('PE', 'Peru', { casesTotal: 10 }),
        country('PE', 'Peru duplicate', { casesTotal: 99 }),
      ]),
    ).toEqual([
      {
        code: 'PE',
        name: 'Peru',
        metrics: {
          casesTotal: 10,
          deathsTotal: null,
          casesNew: null,
        },
      },
    ]);
  });
});

describe('sortExplorerCountryRowsByName', () => {
  it('sorts alphabetically by display name', () => {
    const rows = mapExplorerCountryRows([
      country('US', 'United States'),
      country('BR', 'Brazil'),
      country('PE', 'Peru'),
    ]);

    expect(sortExplorerCountryRowsByName(rows).map((row) => row.code)).toEqual([
      'BR',
      'PE',
      'US',
    ]);
  });
});
