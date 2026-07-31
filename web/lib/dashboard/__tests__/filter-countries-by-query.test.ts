import { describe, expect, it } from 'vitest';

import {
  filterCountriesByQuery,
  MAX_COUNTRY_SEARCH_QUERY_LENGTH,
  normalizeCountrySearchQuery,
  type CountrySearchRow,
} from '../filter-countries-by-query';

const FIXTURE_ROWS: CountrySearchRow[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PE', name: 'Peru' },
  { code: 'BR', name: 'Brazil' },
];

describe('normalizeCountrySearchQuery', () => {
  it('trims whitespace', () => {
    expect(normalizeCountrySearchQuery('  peru  ')).toBe('peru');
  });

  it('caps oversized input', () => {
    const oversized = 'a'.repeat(MAX_COUNTRY_SEARCH_QUERY_LENGTH + 20);
    expect(normalizeCountrySearchQuery(oversized).length).toBe(
      MAX_COUNTRY_SEARCH_QUERY_LENGTH,
    );
  });
});

describe('filterCountriesByQuery', () => {
  it('returns all rows when query is empty', () => {
    expect(filterCountriesByQuery(FIXTURE_ROWS, '')).toEqual(FIXTURE_ROWS);
    expect(filterCountriesByQuery(FIXTURE_ROWS, '   ')).toEqual(FIXTURE_ROWS);
  });

  it('matches country name case insensitively', () => {
    expect(filterCountriesByQuery(FIXTURE_ROWS, 'peru')).toEqual([
      { code: 'PE', name: 'Peru' },
    ]);
    expect(filterCountriesByQuery(FIXTURE_ROWS, 'united')).toEqual([
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
    ]);
  });

  it('matches ISO2 prefix case insensitively', () => {
    expect(filterCountriesByQuery(FIXTURE_ROWS, 'PE')).toEqual([
      { code: 'PE', name: 'Peru' },
    ]);
    expect(filterCountriesByQuery(FIXTURE_ROWS, 'pe')).toEqual([
      { code: 'PE', name: 'Peru' },
    ]);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterCountriesByQuery(FIXTURE_ROWS, 'zzzz')).toEqual([]);
  });

  it('treats special characters as literal search text', () => {
    expect(filterCountriesByQuery(FIXTURE_ROWS, '<script>')).toEqual([]);
  });

  it('preserves row object shape for extended types', () => {
    type Row = CountrySearchRow & { casesTotal: number | null };

    const rows: Row[] = [{ code: 'PE', name: 'Peru', casesTotal: 100 }];
    expect(filterCountriesByQuery(rows, 'peru')).toEqual(rows);
  });
});
